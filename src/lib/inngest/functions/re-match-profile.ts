import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { buildMatchPrompt } from "@/lib/ai/prompts";
import { signalMatchInsightSchema } from "@/types/schemas";
import type { Events } from "@/lib/inngest/types";
import type { Signal, SignalProfile } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

const RELEVANCE_THRESHOLD = 0.4;

async function markRematchCompleted(
  supabase: SupabaseClient,
  userId: string,
  summary: {
    signalsConsidered: number;
    inserted: number;
    updated: number;
  }
) {
  await supabase
    .from("signal_profiles")
    .update({
      rematch_status: "completed",
      rematch_finished_at: new Date().toISOString(),
      rematch_error: null,
      rematch_signals_considered: summary.signalsConsidered,
      rematch_inserted: summary.inserted,
      rematch_updated: summary.updated,
    })
    .eq("user_id", userId);
}

async function markRematchFailed(supabase: SupabaseClient, userId: string, message: string) {
  await supabase
    .from("signal_profiles")
    .update({
      rematch_status: "failed",
      rematch_finished_at: new Date().toISOString(),
      rematch_error: message,
    })
    .eq("user_id", userId);
}

export const reMatchProfile = inngest.createFunction(
  {
    id: "re-match-profile",
    retries: 2,
    onFailure: async ({ event, error }) => {
      const supabase = await createServiceClient();
      const original = event.data.event as {
        data?: { userId?: string };
      };
      const userId = original?.data?.userId;
      if (!userId) return;
      await markRematchFailed(
        supabase,
        userId,
        error.message ?? "Scan failed after retries"
      );
    },
  },
  { event: "profile/re-match.requested" },
  async ({ event, step }) => {
    const { userId } = event.data as Events["profile/re-match.requested"]["data"];
    if (!userId) {
      return { processed: 0, error: "Missing userId" };
    }

    const supabase = await createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from("signal_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      await markRematchFailed(supabase, userId, "Profile not found.");
      return { processed: 0, error: "Profile not found" };
    }

    const embedding = (profile as SignalProfile).profile_embedding;
    if (!embedding?.length) {
      await markRematchFailed(supabase, userId, "Profile has no embedding.");
      return { processed: 0, error: "Profile has no embedding" };
    }

    const embeddingStr = Array.isArray(embedding)
      ? `[${embedding.join(",")}]`
      : typeof embedding === "string"
        ? embedding
        : null;
    if (!embeddingStr) {
      await markRematchFailed(supabase, userId, "Invalid profile embedding.");
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
      await markRematchCompleted(supabase, userId, {
        signalsConsidered: 0,
        inserted: 0,
        updated: 0,
      });
      return { processed: 0, inserted: 0, updated: 0, signalIds: [] };
    }

    let inserted = 0;
    let updated = 0;

    for (const m of matches as Array<{ signal_id: string; similarity: number }>) {
      await step.run(`re-match-signal-${m.signal_id}`, async () => {
        const { data: signal, error: signalError } = await supabase
          .from("signals")
          .select("*")
          .eq("id", m.signal_id)
          .single();

        if (signalError || !signal) return;

        const result = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: signalMatchInsightSchema,
          prompt: buildMatchPrompt(signal as Signal, profile as SignalProfile),
        });

        const insight = result.object;
        if (insight.relevance_score < RELEVANCE_THRESHOLD) return;

        const { data: existing } = await supabase
          .from("signal_matches")
          .select("id, is_read, is_bookmarked")
          .eq("signal_id", m.signal_id)
          .eq("user_id", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("signal_matches")
            .update({
              relevance_score: insight.relevance_score,
              why_it_matters: insight.why_it_matters,
              action_suggestion: insight.action_suggestion,
            })
            .eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("signal_matches").insert({
            signal_id: m.signal_id,
            user_id: userId,
            relevance_score: insight.relevance_score,
            why_it_matters: insight.why_it_matters,
            action_suggestion: insight.action_suggestion,
          });
          inserted++;
        }
      });
    }

    await markRematchCompleted(supabase, userId, {
      signalsConsidered: matches.length,
      inserted,
      updated,
    });

    return { processed: matches.length, inserted, updated };
  }
);
