import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import type { Events } from "@/lib/inngest/types";
import type { SupabaseClient } from "@supabase/supabase-js";

async function runWasCancelled(
  supabase: SupabaseClient,
  runId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("profile_rematch_runs")
    .select("status")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  return !data || data.status !== "running";
}

/** Persists live progress so scan history and dashboard update while the job runs. */
async function persistRematchProgress(
  supabase: SupabaseClient,
  runId: string,
  userId: string,
  progress: {
    candidatesTotal: number;
    processed: number;
    inserted: number;
    updated: number;
  }
) {
  await supabase
    .from("profile_rematch_runs")
    .update({
      candidates_total: progress.candidatesTotal,
      signals_considered: progress.processed,
      inserted: progress.inserted,
      updated: progress.updated,
    })
    .eq("id", runId)
    .eq("user_id", userId);

  await supabase
    .from("signal_profiles")
    .update({
      rematch_candidates_total: progress.candidatesTotal,
      rematch_signals_considered: progress.processed,
      rematch_inserted: progress.inserted,
      rematch_updated: progress.updated,
    })
    .eq("user_id", userId);
}

async function markRematchCompleted(
  supabase: SupabaseClient,
  userId: string,
  summary: {
    signalsConsidered: number;
    inserted: number;
    updated: number;
  },
  runId: string
) {
  await supabase.from("signal_profiles").update({
    rematch_status: "completed",
    rematch_finished_at: new Date().toISOString(),
    rematch_error: null,
    rematch_signals_considered: summary.signalsConsidered,
    rematch_candidates_total: null,
    rematch_inserted: summary.inserted,
    rematch_updated: summary.updated,
  }).eq("user_id", userId);

  const finishedAt = new Date().toISOString();
  const { error: runErr } = await supabase
    .from("profile_rematch_runs")
    .update({
      status: "completed",
      finished_at: finishedAt,
      error_message: null,
      candidates_total: summary.signalsConsidered,
      signals_considered: summary.signalsConsidered,
      inserted: summary.inserted,
      updated: summary.updated,
    })
    .eq("id", runId)
    .eq("user_id", userId);
  if (runErr) {
    console.error("Failed to finalize profile_rematch_runs row:", runErr);
  }
}

async function markRematchFailed(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  runId: string
) {
  await supabase.from("signal_profiles").update({
    rematch_status: "failed",
    rematch_finished_at: new Date().toISOString(),
    rematch_error: message,
    rematch_candidates_total: null,
  }).eq("user_id", userId);

  const finishedAt = new Date().toISOString();
  const { error: runErr } = await supabase
    .from("profile_rematch_runs")
    .update({
      status: "failed",
      finished_at: finishedAt,
      error_message: message,
    })
    .eq("id", runId)
    .eq("user_id", userId);
  if (runErr) {
    console.error("Failed to mark profile_rematch_runs failed:", runErr);
  }
}

export const reMatchProfile = inngest.createFunction(
  {
    id: "re-match-profile",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const supabase = await createServiceClient();
      const original = event.data.event as {
        data?: { userId?: string; runId?: string };
      };
      const userId = original?.data?.userId;
      const runId = original?.data?.runId;
      if (!userId) return;
      const message = error.message ?? "Scan failed after retries";
      if (runId) {
        await markRematchFailed(supabase, userId, message, runId);
        return;
      }
      await supabase
        .from("signal_profiles")
        .update({
          rematch_status: "failed",
          rematch_finished_at: new Date().toISOString(),
          rematch_error: message,
          rematch_candidates_total: null,
        })
        .eq("user_id", userId);
    },
  },
  { event: "profile/re-match.requested" },
  async ({ event, step }) => {
    const { userId, runId } = event.data as Events["profile/re-match.requested"]["data"];
    if (!userId || !runId) {
      return { processed: 0, error: "Missing userId or runId" };
    }

    const supabase = await createServiceClient();

    if (await runWasCancelled(supabase, runId, userId)) {
      return { processed: 0, skipped: "cancelled" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("signal_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      await markRematchFailed(supabase, userId, "Profile not found.", runId);
      return { processed: 0, error: "Profile not found" };
    }

    const embedding = profile.profile_embedding;
    if (!embedding?.length) {
      await markRematchFailed(supabase, userId, "Profile has no embedding.", runId);
      return { processed: 0, error: "Profile has no embedding" };
    }

    const embeddingStr = Array.isArray(embedding)
      ? `[${embedding.join(",")}]`
      : typeof embedding === "string"
        ? embedding
        : null;
    if (!embeddingStr) {
      await markRematchFailed(supabase, userId, "Invalid profile embedding.", runId);
      return { processed: 0, error: "Invalid profile embedding" };
    }

    const { data: matches, error: matchError } = await supabase.rpc(
      "match_profile_to_signals",
      {
        profile_embedding: embeddingStr,
        match_threshold: 0.3,
        match_count: 100,
      }
    );

    if (matchError) {
      throw new Error(matchError.message);
    }

    if (!matches?.length) {
      if (await runWasCancelled(supabase, runId, userId)) {
        return { processed: 0, skipped: "cancelled" };
      }
      await markRematchCompleted(
        supabase,
        userId,
        {
          signalsConsidered: 0,
          inserted: 0,
          updated: 0,
        },
        runId
      );
      return { processed: 0, inserted: 0, updated: 0, signalIds: [] };
    }

    const total = matches.length;
    await persistRematchProgress(supabase, runId, userId, {
      candidatesTotal: total,
      processed: 0,
      inserted: 0,
      updated: 0,
    });

    const batchResult = await step.run("apply-profile-vector-matches", async () => {
      if (await runWasCancelled(supabase, runId, userId)) {
        return { cancelled: true as const, inserted: 0, updated: 0 };
      }

      let inserted = 0;
      let updated = 0;

      for (const raw of matches) {
        const m = raw as { signal_id: string; similarity: number };

        const { data: signal, error: signalError } = await supabase
          .from("signals")
          .select("id")
          .eq("id", m.signal_id)
          .maybeSingle();

        if (signalError || !signal) continue;

        const { data: existing } = await supabase
          .from("signal_matches")
          .select("id")
          .eq("signal_id", m.signal_id)
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("signal_matches")
            .update({ relevance_score: m.similarity })
            .eq("id", existing.id);
          updated += 1;
        } else {
          await supabase.from("signal_matches").insert({
            signal_id: m.signal_id,
            user_id: userId,
            relevance_score: m.similarity,
            why_it_matters: null,
            action_suggestion: null,
          });
          inserted += 1;
        }
      }

      await persistRematchProgress(supabase, runId, userId, {
        candidatesTotal: total,
        processed: matches.length,
        inserted,
        updated,
      });

      return { cancelled: false as const, inserted, updated };
    });

    if (
      batchResult &&
      typeof batchResult === "object" &&
      "cancelled" in batchResult &&
      batchResult.cancelled
    ) {
      return { processed: matches.length, skipped: "cancelled" };
    }

    if (await runWasCancelled(supabase, runId, userId)) {
      return { processed: matches.length, skipped: "cancelled" };
    }

    const inserted =
      batchResult && typeof batchResult === "object" && "inserted" in batchResult
        ? (batchResult as { inserted: number }).inserted
        : 0;
    const updated =
      batchResult && typeof batchResult === "object" && "updated" in batchResult
        ? (batchResult as { updated: number }).updated
        : 0;

    await markRematchCompleted(
      supabase,
      userId,
      {
        signalsConsidered: matches.length,
        inserted,
        updated,
      },
      runId
    );

    return { processed: matches.length, inserted, updated };
  }
);
