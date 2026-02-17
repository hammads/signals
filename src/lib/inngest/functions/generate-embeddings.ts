import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { buildSignalEmbeddingText } from "@/lib/utils";
import type { Events } from "@/lib/inngest/types";

export const generateEmbeddings = inngest.createFunction(
  {
    id: "generate-embeddings",
    retries: 2,
  },
  { event: "signal/batch.collected" },
  async ({ event, step }) => {
    const { signalIds } = event.data as Events["signal/batch.collected"]["data"];
    if (!signalIds?.length) return { processed: 0, signalIds: [] };

    const supabase = await createServiceClient();

    const signals = await step.run("fetch-signals-without-embeddings", async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("id, title, raw_content, signal_category, region")
        .in("id", signalIds)
        .is("content_embedding", null);
      if (error) throw error;
      return data ?? [];
    });

    if (!signals?.length) return { processed: 0, signalIds: [] };

    const processedIds: string[] = [];

    for (const signal of signals) {
      await step.run(`embed-signal-${signal.id}`, async () => {
        const text = buildSignalEmbeddingText({
          title: signal.title,
          raw_content: signal.raw_content,
          signal_category: signal.signal_category,
          region: signal.region,
        });
        const { embedding } = await embed({
          model: openai.embedding("text-embedding-3-small"),
          value: text,
        });

        const { error } = await supabase
          .from("signals")
          .update({ content_embedding: embedding as unknown as number[] })
          .eq("id", signal.id);
        if (error) throw error;
        processedIds.push(signal.id);
      });
    }

    if (processedIds.length > 0) {
      await step.sendEvent("emit-embeddings-ready", [
        { name: "signal/embeddings.ready", data: { signalIds: processedIds } },
      ]);
    }

    return { processed: processedIds.length, signalIds: processedIds };
  }
);
