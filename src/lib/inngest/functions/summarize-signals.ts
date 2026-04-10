import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { buildMatchPrompt } from "@/lib/ai/prompts";
import { signalMatchInsightSchema } from "@/types/schemas";
import type { Events } from "@/lib/inngest/types";
import type { Signal, SignalProfile } from "@/types/database";

const RELEVANCE_THRESHOLD = 0.4;

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
      await step.run(`summarize-signal-${signalId}`, async () => {
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

        // Load resolved district labels for this signal
        const { data: districtRows } = await supabase
          .from("signal_districts_expanded")
          .select("district_label")
          .eq("signal_id", signalId);
        const districtLabels = (districtRows ?? []).map(
          (r: { district_label: string }) => r.district_label
        );

        const { data: matches } = await supabase.rpc("match_signal_to_profiles", {
          signal_embedding: embeddingStr,
          match_threshold: 0.3,
          match_count: 50,
        });

        if (!matches?.length) return;

        for (const m of matches as Array<{ profile_id: string; user_id: string; similarity: number }>) {
          const { data: profile } = await supabase
            .from("signal_profiles")
            .select("*")
            .eq("id", m.profile_id)
            .single();

          if (!profile) continue;

          const result = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: signalMatchInsightSchema,
            prompt: buildMatchPrompt(signal as Signal, profile as SignalProfile, districtLabels),
          });

          const insight = result.object;
          if (insight.relevance_score < RELEVANCE_THRESHOLD) continue;

          await supabase.from("signal_matches").insert({
            signal_id: signalId,
            user_id: m.user_id,
            relevance_score: insight.relevance_score,
            why_it_matters: insight.why_it_matters,
            action_suggestion: insight.action_suggestion,
          });
        }
      });
    }

    return { processed: signalIds.length };
  }
);
