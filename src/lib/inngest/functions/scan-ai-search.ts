import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import type { DataSource, Signal } from "@/types/database";

const TAVILY_API = "https://api.tavily.com/search";

export const scanAISearch = inngest.createFunction(
  {
    id: "scan-ai-search",
    retries: 2,
  },
  [{ cron: "0 8 * * *" }, { event: "pipeline/scan.ai-search" }],
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

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      if (jobRun?.id) {
        await supabase
          .from("pipeline_runs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: "TAVILY_API_KEY not configured",
          })
          .eq("id", jobRun.id);
      }
      return { error: "TAVILY_API_KEY not configured", signalIds: [] };
    }

    const sources = await step.run(
      "fetch-ai-search-sources",
      async () => {
        const { data, error } = await supabase
          .from("data_sources")
          .select("*")
          .eq("source_type", "ai_search")
          .eq("is_active", true);
        if (error) throw error;
        return (data ?? []) as DataSource[];
      }
    );

    if (!sources?.length) {
      if (jobRun?.id) {
        await supabase
          .from("pipeline_runs")
          .update({
            status: "completed",
            signals_found: 0,
            completed_at: new Date().toISOString(),
            error_message: "No active AI search sources configured",
          })
          .eq("id", jobRun.id);
      }
      return { scanned: 0, signalIds: [] };
    }

    const allSignalIds: string[] = [];

    for (const source of sources) {
      const config = source.config as { query_template?: string };
      const query =
        config?.query_template && typeof config.query_template === "string"
          ? config.query_template
          : "K-12 education technology market news grants RFPs";

      const results = await step.run(`tavily-search-${source.id}`, async () => {
        const res = await fetch(TAVILY_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query,
            max_results: 10,
          }),
        });
        if (!res.ok) throw new Error(`Tavily API error: ${res.status} ${res.statusText}`);
        return res.json() as Promise<{
          results?: Array<{
            title?: string;
            url?: string;
            content?: string;
            score?: number;
          }>;
        }>;
      });

      const items = results?.results ?? [];
      if (items.length === 0) continue;

      const { signalIds } = await step.run(`insert-ai-search-signals-${source.id}`, async () => {
        const urls = items.map((r) => r.url ?? "").filter(Boolean);
        const { data: existing } = await supabase
          .from("signals")
          .select("source_url")
          .in("source_url", urls);
        const existingUrls = new Set(
          (existing ?? []).map((r) => (r as { source_url: string }).source_url)
        );

        const { data: run } = await supabase
          .from("pipeline_runs")
          .insert({
            data_source_id: source.id,
            status: "running",
            signals_found: 0,
            started_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        const toInsert: Omit<Signal, "id" | "created_at" | "content_embedding">[] = [];
        for (const r of items) {
          const url = r.url ?? "";
          if (!url || existingUrls.has(url)) continue;

          toInsert.push({
            source_type: "ai_search",
            source_url: url,
            title: r.title ?? "Untitled",
            raw_content: r.content ?? null,
            published_at: null,
            region: null,
            signal_category: null,
            metadata: {
              score: r.score,
              query,
              sourceId: source.id,
            },
          });
          existingUrls.add(url);
        }

        if (toInsert.length === 0) {
          if (run?.id) {
            await supabase
              .from("pipeline_runs")
              .update({
                status: "completed",
                signals_found: 0,
                completed_at: new Date().toISOString(),
              })
              .eq("id", run.id);
          }
          await supabase
            .from("data_sources")
            .update({ last_scanned_at: new Date().toISOString() })
            .eq("id", source.id);
          return { signalIds: [] as string[] };
        }

        const { data: inserted } = await supabase
          .from("signals")
          .insert(toInsert)
          .select("id");
        const signalIds = (inserted ?? []).map((r) => r.id);

        if (run?.id) {
          await supabase
            .from("pipeline_runs")
            .update({
              status: "completed",
              signals_found: signalIds.length,
              completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
        }

        await supabase
          .from("data_sources")
          .update({ last_scanned_at: new Date().toISOString() })
          .eq("id", source.id);

        return { signalIds };
      });

      if (signalIds?.length) {
        allSignalIds.push(...signalIds);
      }
    }

    if (allSignalIds.length > 0) {
      await step.sendEvent("emit-batch-collected", [
        { name: "signal/batch.collected", data: { signalIds: allSignalIds } },
      ]);
    }

    if (jobRun?.id) {
      await supabase
        .from("pipeline_runs")
        .update({
          status: "completed",
          signals_found: allSignalIds.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobRun.id);
    }

    return { scanned: sources.length, signalIds: allSignalIds };
  }
);
