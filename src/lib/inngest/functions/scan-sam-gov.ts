import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import type { Signal } from "@/types/database";
import type { SignalCategory } from "@/types/database";

const SAM_GOV_API = "https://api.sam.gov/opportunities/v2/search";

function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}

function mapTypeToCategory(type: string | undefined): SignalCategory {
  const t = (type ?? "").toLowerCase();
  if (t.includes("award")) return "grant";
  if (t.includes("solicitation") || t.includes("combined") || t.includes("presolicitation"))
    return "rfp";
  if (t.includes("sources sought") || t.includes("special notice")) return "rfp";
  return "rfp";
}

export const scanSamGov = inngest.createFunction(
  {
    id: "scan-sam-gov",
    retries: 2,
  },
  [{ cron: "0 */12 * * *" }, { event: "pipeline/scan.sam-gov" }],
  async ({ step }) => {
    const supabase = await createServiceClient();

    const { data: jobRun } = await supabase
      .from("pipeline_runs")
      .insert({
        data_source_id: null,
        status: "running",
        signals_found: 0,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      if (jobRun?.id) {
        await supabase
          .from("pipeline_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: "SAM_GOV_API_KEY not configured",
          })
          .eq("id", jobRun.id);
      }
      return { skipped: true, reason: "SAM_GOV_API_KEY not configured", signalIds: [] };
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const postedFrom = formatDate(yesterday);
    const postedTo = formatDate(now);

    const response = await step.run("fetch-sam-gov", async () => {
      const url = new URL(SAM_GOV_API);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("postedFrom", postedFrom);
      url.searchParams.set("postedTo", postedTo);
      url.searchParams.set("title", "education");
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`SAM.gov API error: ${res.status} ${res.statusText}`);
      return res.json() as Promise<{
        opportunitiesData?: Array<{
          noticeId?: string;
          title?: string;
          postedDate?: string;
          type?: string;
          uiLink?: string;
          description?: string;
        }>;
      }>;
    });

    const opportunities = response?.opportunitiesData ?? [];
    if (opportunities.length === 0) {
      if (jobRun?.id) {
        await supabase
          .from("pipeline_runs")
          .update({
            status: "completed",
            signals_found: 0,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobRun.id);
      }
      return { signalIds: [] };
    }

    const { signalIds } = await step.run("insert-sam-gov-signals", async () => {
      const urls = opportunities.map((o) => {
        return o.uiLink ?? `https://sam.gov/opp/${o.noticeId}/view`;
      });

      const { data: existing } = await supabase
        .from("signals")
        .select("source_url")
        .in("source_url", urls);
      const existingUrls = new Set(
        (existing ?? []).map((r) => (r as { source_url: string }).source_url)
      );

      const runId = jobRun?.id ?? null;

      const toInsert: Omit<Signal, "id" | "created_at" | "content_embedding">[] = [];
      for (let i = 0; i < opportunities.length; i++) {
        const o = opportunities[i];
        const sourceUrl = o.uiLink ?? `https://sam.gov/opp/${o.noticeId}/view`;
        if (existingUrls.has(sourceUrl)) continue;

        toInsert.push({
          source_type: "sam_gov",
          source_url: sourceUrl,
          title: o.title ?? "Untitled SAM.gov Opportunity",
          raw_content: null,
          published_at: o.postedDate ?? null,
          region: null,
          signal_category: mapTypeToCategory(o.type),
          metadata: {
            noticeId: o.noticeId,
            type: o.type,
            description: o.description,
          },
        });
        existingUrls.add(sourceUrl);
      }

      if (toInsert.length === 0) {
        if (runId) {
          await supabase
            .from("pipeline_runs")
            .update({
              status: "completed",
              signals_found: 0,
              completed_at: new Date().toISOString(),
            })
            .eq("id", runId);
        }
        return { signalIds: [] as string[] };
      }

      const { data: inserted } = await supabase
        .from("signals")
        .insert(toInsert)
        .select("id");
      const signalIds = (inserted ?? []).map((r) => r.id);

      if (runId) {
        await supabase
          .from("pipeline_runs")
          .update({
            status: "completed",
            signals_found: signalIds.length,
            completed_at: new Date().toISOString(),
          })
          .eq("id", runId);
      }

      return { signalIds };
    });

    if (signalIds?.length) {
      await step.sendEvent("emit-batch-collected", [
        { name: "signal/batch.collected", data: { signalIds } },
      ]);
    }

    return { signalIds: signalIds ?? [] };
  }
);
