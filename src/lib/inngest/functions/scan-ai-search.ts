import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { createPipelineLogger } from "@/lib/inngest/pipeline-logger";
import type { DataSource, Signal } from "@/types/database";

const TAVILY_API = "https://api.tavily.com/search";

export const scanAISearch = inngest.createFunction(
  {
    id: "scan-ai-search",
    retries: 2,
    timeouts: { finish: "10m" },
  },
  [
    { cron: "0 8 * * *" },
    { event: "pipeline/scan.ai-search" },
    { event: "pipeline/scan.ai-search.source" },
  ],
  async ({ step, event, logger: inngestLogger }) => {
    const supabase = await createServiceClient();
    const dataSourceId = event?.name === "pipeline/scan.ai-search.source"
      ? (event.data as { data_source_id?: string })?.data_source_id
      : undefined;

    inngestLogger.info("[scan-ai-search] Starting AI Search pipeline scan", {
      trigger: event?.name ?? "cron",
      dataSourceId: dataSourceId ?? "all",
    });

    const jobRun = await step.run("create-pipeline-run", async () => {
      const { data } = await supabase
        .from("pipeline_runs")
        .insert({
          data_source_id: null,
          pipeline_type: "ai_search",
          status: "running",
          signals_found: 0,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      return data;
    });

    const log = createPipelineLogger(supabase, jobRun?.id, inngestLogger);

    await log.info("AI Search pipeline started", { trigger: event?.name ?? "cron", runId: jobRun?.id });

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      await log.error("TAVILY_API_KEY not configured — aborting");
      if (jobRun?.id) {
        await supabase.from("pipeline_runs").update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: "TAVILY_API_KEY not configured",
        }).eq("id", jobRun.id);
      }
      return { error: "TAVILY_API_KEY not configured", signalIds: [] };
    }

    const sources = await step.run("fetch-ai-search-sources", async () => {
      if (dataSourceId) {
        const { data, error } = await supabase
          .from("data_sources").select("*")
          .eq("id", dataSourceId).eq("source_type", "ai_search").single();
        if (error || !data) {
          await log.warn("Data source not found or not ai_search type", { dataSourceId, error: error?.message });
          return [] as DataSource[];
        }
        await log.info("Fetched single data source", { name: data.name });
        return [data] as DataSource[];
      }
      const { data, error } = await supabase
        .from("data_sources").select("*")
        .eq("source_type", "ai_search").eq("is_active", true);
      if (error) throw error;
      await log.info("Fetched active AI search sources", { count: data?.length ?? 0 });
      return (data ?? []) as DataSource[];
    });

    if (!sources?.length) {
      await log.warn("No active AI search sources found — completing early");
      if (jobRun?.id) {
        await supabase.from("pipeline_runs").update({
          status: "completed",
          signals_found: 0,
          completed_at: new Date().toISOString(),
          error_message: "No active AI search sources configured",
        }).eq("id", jobRun.id);
      }
      return { scanned: 0, signalIds: [] };
    }

    const allSignalIds: string[] = [];

    for (const source of sources) {
      const config = source.config as { query_template?: string };
      const query = config?.query_template && typeof config.query_template === "string"
        ? config.query_template
        : "K-12 education technology market news grants RFPs";

      await log.info("Searching Tavily for source", { sourceId: source.id, name: source.name, query });

      const results = await step.run(`tavily-search-${source.id}`, async () => {
        const res = await fetch(TAVILY_API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ query, max_results: 10 }),
        });
        if (!res.ok) {
          await log.error("Tavily API error", { status: res.status, statusText: res.statusText, sourceId: source.id });
          throw new Error(`Tavily API error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json() as {
          results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
        };
        await log.info("Tavily search complete", { sourceId: source.id, resultCount: data.results?.length ?? 0 });
        return data;
      });

      const items = results?.results ?? [];
      if (items.length === 0) {
        await log.info("No results from Tavily for source", { sourceId: source.id, name: source.name });
        continue;
      }

      const { signalIds } = await step.run(`insert-ai-search-signals-${source.id}`, async () => {
        const urls = items.map((r) => r.url ?? "").filter(Boolean);
        const { data: existing } = await supabase.from("signals").select("source_url").in("source_url", urls);
        const existingUrls = new Set(
          (existing ?? []).map((r) => (r as { source_url: string }).source_url)
        );

        await log.info("Deduplication check", {
          sourceId: source.id,
          name: source.name,
          totalItems: items.length,
          alreadyExist: existingUrls.size,
          newItems: items.length - existingUrls.size,
        });

        const { data: run } = await supabase
          .from("pipeline_runs")
          .insert({
            data_source_id: source.id,
            pipeline_type: "ai_search",
            parent_run_id: jobRun?.id ?? null,
            status: "running",
            signals_found: 0,
            started_at: new Date().toISOString(),
          })
          .select("id").single();

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
            metadata: { score: r.score, query, sourceId: source.id },
          });
          existingUrls.add(url);
        }

        if (toInsert.length === 0) {
          await log.info("No new signals (all duplicates)", { sourceId: source.id, name: source.name });
          if (run?.id) {
            await supabase.from("pipeline_runs").update({
              status: "completed", signals_found: 0, completed_at: new Date().toISOString(),
            }).eq("id", run.id);
          }
          await supabase.from("data_sources").update({ last_scanned_at: new Date().toISOString() }).eq("id", source.id);
          return { signalIds: [] as string[] };
        }

        const { data: inserted, error: insertError } = await supabase
          .from("signals").insert(toInsert).select("id");

        if (insertError) {
          await log.error("Failed to insert signals", {
            sourceId: source.id, name: source.name, count: toInsert.length, error: insertError.message,
          });
          throw insertError;
        }

        const signalIds = (inserted ?? []).map((r) => r.id);
        await log.info("Inserted new signals", { sourceId: source.id, name: source.name, count: signalIds.length });

        if (run?.id) {
          await supabase.from("pipeline_runs").update({
            status: "completed", signals_found: signalIds.length, completed_at: new Date().toISOString(),
          }).eq("id", run.id);
        }
        await supabase.from("data_sources").update({ last_scanned_at: new Date().toISOString() }).eq("id", source.id);

        return { signalIds };
      });

      if (signalIds?.length) allSignalIds.push(...signalIds);
    }

    await log.info("All sources scanned", { sourcesCount: sources.length, totalNewSignals: allSignalIds.length });

    if (allSignalIds.length > 0) {
      await step.sendEvent("emit-batch-collected", [
        { name: "signal/batch.collected", data: { signalIds: allSignalIds } },
        { name: "signal/ai-search.completed", data: { signalIds: allSignalIds } },
      ]);
      await log.info("Emitted signal/batch.collected + signal/ai-search.completed", { count: allSignalIds.length });
    }

    if (jobRun?.id) {
      await supabase.from("pipeline_runs").update({
        status: "completed", signals_found: allSignalIds.length, completed_at: new Date().toISOString(),
      }).eq("id", jobRun.id);
    }

    await log.info("Pipeline run complete", { totalSignals: allSignalIds.length });
    return { scanned: sources.length, signalIds: allSignalIds };
  }
);
