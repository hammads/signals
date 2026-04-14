import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import type { Events } from "@/lib/inngest/types";
import type { Signal } from "@/types/database";

export const summarizeSignals = inngest.createFunction(
  {
    id: "summarize-signals",
    retries: 2,
  },
  { event: "signal/embeddings.ready" },
  async ({ event, step }) => {
    const { signalIds } = event.data as Events["signal/embeddings.ready"]["data"];
    if (!signalIds?.length) return { processed: 0 };

    const supabase = await createServiceClient();

    for (const signalId of signalIds) {
      await step.run(`vector-match-signal-${signalId}`, async () => {
        const { data: signal, error: signalError } = await supabase
          .from("signals")
          .select("*")
          .eq("id", signalId)
          .single();

        if (signalError || !signal) throw new Error(`Signal ${signalId} not found`);

        const embedding = (signal as Signal).content_embedding;
        if (!embedding?.length) return;

        const embeddingStr = Array.isArray(embedding)
          ? `[${embedding.join(",")}]`
          : typeof embedding === "string"
            ? embedding
            : null;
        if (!embeddingStr) return;

        const { data: matches } = await supabase.rpc("match_signal_to_profiles", {
          signal_embedding: embeddingStr,
          match_threshold: 0.3,
          match_count: 50,
        });

        if (!matches?.length) return;

        for (const raw of matches as Array<{
          profile_id: string;
          user_id: string;
          similarity: number;
        }>) {
          const m = raw;

          const { data: existing } = await supabase
            .from("signal_matches")
            .select("id")
            .eq("signal_id", signalId)
            .eq("user_id", m.user_id)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("signal_matches")
              .update({ relevance_score: m.similarity })
              .eq("id", existing.id);
          } else {
            await supabase.from("signal_matches").insert({
              signal_id: signalId,
              user_id: m.user_id,
              relevance_score: m.similarity,
              why_it_matters: null,
              action_suggestion: null,
            });
          }
        }
      });
    }

    return { processed: signalIds.length };
  }
);
