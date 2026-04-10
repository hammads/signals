import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { enrichSignalWithDistricts } from "@/lib/districts/enrich";
import type { Events } from "@/lib/inngest/types";

export const enrichSignalDistricts = inngest.createFunction(
  {
    id: "enrich-signal-districts",
    retries: 2,
  },
  { event: "signal/batch.collected" },
  async ({ event, step }) => {
    const { signalIds } = event.data as Events["signal/batch.collected"]["data"];
    if (!signalIds?.length) {
      await step.sendEvent("emit-districts-enriched-empty", [
        { name: "signal/districts.enriched", data: { signalIds: [] } },
      ]);
      return { enriched: 0, signalIds: [] };
    }

    const supabase = await createServiceClient();

    const signals = await step.run("fetch-signals-for-enrichment", async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("id, title, raw_content, region")
        .in("id", signalIds);
      if (error) throw error;
      return data ?? [];
    });

    const enrichedIds: string[] = [];

    for (const signal of signals) {
      await step.run(`enrich-districts-${signal.id}`, async () => {
        try {
          const { resolved } = await enrichSignalWithDistricts(signal, supabase);
          if (resolved.length > 0) enrichedIds.push(signal.id);
        } catch (err) {
          // Log but do not rethrow — we must always emit the downstream event
          console.error(`District enrichment failed for signal ${signal.id}:`, err);
        }
      });
    }

    // Always emit signal/districts.enriched so generate-embeddings always runs
    await step.sendEvent("emit-districts-enriched", [
      { name: "signal/districts.enriched", data: { signalIds } },
    ]);

    return { enriched: enrichedIds.length, signalIds };
  }
);
