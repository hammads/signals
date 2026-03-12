import Parser from "rss-parser";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { createPipelineLogger } from "@/lib/inngest/pipeline-logger";
import type { DataSource, Signal } from "@/types/database";
import type { SignalCategory } from "@/types/database";
const parser = new Parser();

const CATEGORY_KEYWORDS: Record<string, SignalCategory> = {
  grant: "grant",
  rfp: "rfp",
  "request for proposal": "rfp",
  solicitation: "rfp",
  "board meeting": "board_minutes",
  "board minutes": "board_minutes",
  "board agenda": "board_minutes",
  policy: "policy",
  legislation: "policy",
  competitor: "competitor",
  news: "news",
};

function inferSignalCategory(title: string): SignalCategory | null {
  const lower = title.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category;
  }
  return null;
}

export const scanRSS = inngest.createFunction(
  {
    id: "scan-rss",
    retries: 2,
    timeouts: { finish: "15m" },
  },
  [
    { cron: "0 */6 * * *" },
    { event: "pipeline/scan.rss" },
    { event: "pipeline/scan.rss.source" },
  ],
  async ({ step, event, logger: inngestLogger }) => {
    const supabase = await createServiceClient();
    const dataSourceId = event?.name === "pipeline/scan.rss.source"
      ? (event.data as { data_source_id?: string })?.data_source_id
      : undefined;

    inngestLogger.info("[scan-rss] Starting RSS pipeline scan", {
      trigger: event?.name ?? "cron",
      dataSourceId: dataSourceId ?? "all",
    });

    const jobRun = await step.run("create-pipeline-run", async () => {
      const { data } = await supabase
        .from("pipeline_runs")
        .insert({
          data_source_id: null,
          pipeline_type: "rss",
          status: "running",
          signals_found: 0,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      return data;
    });

    // All logs after this point are stored in DB (visible in admin UI) + Inngest dashboard
    const log = createPipelineLogger(supabase, jobRun?.id, inngestLogger);

    await log.info("RSS pipeline started", { trigger: event?.name ?? "cron", runId: jobRun?.id });

    const sources = await step.run("fetch-rss-sources", async () => {
      if (dataSourceId) {
        const { data, error } = await supabase
          .from("data_sources")
          .select("*")
          .eq("id", dataSourceId)
          .eq("source_type", "rss")
          .single();
        if (error || !data) {
          await log.warn("Data source not found or not RSS type", { dataSourceId, error: error?.message });
          return [] as DataSource[];
        }
        await log.info("Fetched single data source", { name: data.name });
        return [data] as DataSource[];
      }
      const { data, error } = await supabase
        .from("data_sources")
        .select("*")
        .eq("source_type", "rss")
        .eq("is_active", true);
      if (error) throw error;
      await log.info("Fetched active RSS sources", { count: data?.length ?? 0 });
      return (data ?? []) as DataSource[];
    });

    if (!sources?.length) {
      await log.warn("No active RSS sources found — completing early");
      if (jobRun?.id) {
        await supabase.from("pipeline_runs").update({
          status: "completed",
          signals_found: 0,
          completed_at: new Date().toISOString(),
          error_message: "No active RSS sources configured",
        }).eq("id", jobRun.id);
      }
      return { scanned: 0, signalIds: [] };
    }

    const allSignalIds: string[] = [];

    for (const source of sources) {
      const config = source.config as { url?: string };
      const url = config?.url;
      if (!url || typeof url !== "string") {
        await log.warn("Skipping source with no URL", { sourceId: source.id, name: source.name });
        continue;
      }

      await log.info("Scanning RSS source", { sourceId: source.id, name: source.name, url });

      const { signalIds } = await step.run(`scan-rss-source-${source.id}`, async () => {
        let feed;
        try {
          feed = await parser.parseURL(url);
        } catch (err) {
          await log.error("Failed to fetch RSS feed", {
            sourceId: source.id,
            name: source.name,
            url,
            error: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }

        if (!feed?.items?.length) {
          await log.info("Feed returned no items", { sourceId: source.id, name: source.name });
          return { signalIds: [] as string[], runId: null as string | null };
        }

        await log.info("Feed fetched", { sourceId: source.id, name: source.name, itemCount: feed.items.length });

        const urls = feed.items.map((i: { link?: string; guid?: string }) => i.link ?? i.guid ?? "").filter(Boolean);
        const { data: existingSignals } = await supabase
          .from("signals").select("source_url").in("source_url", urls);
        const existingSourceUrls = new Set(
          (existingSignals ?? []).map((r) => (r as { source_url: string }).source_url)
        );

        await log.info("Deduplication check", {
          sourceId: source.id,
          name: source.name,
          totalItems: feed.items.length,
          alreadyExist: existingSourceUrls.size,
          newItems: feed.items.length - existingSourceUrls.size,
        });

        const { data: run } = await supabase
          .from("pipeline_runs")
          .insert({
            data_source_id: source.id,
            pipeline_type: "rss",
            parent_run_id: jobRun?.id ?? null,
            status: "running",
            signals_found: 0,
            started_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        const runId = run?.id ?? null;

        const toInsert: Omit<Signal, "id" | "created_at" | "content_embedding">[] = [];
        for (const item of feed.items) {
          const link = item.link ?? item.guid ?? "";
          if (!link || existingSourceUrls.has(link)) continue;
          toInsert.push({
            source_type: "rss",
            source_url: link,
            title: item.title ?? "Untitled",
            raw_content: item.contentSnippet ?? item.content ?? null,
            published_at: item.pubDate ?? null,
            region: null,
            signal_category: inferSignalCategory(item.title ?? ""),
            metadata: { feedTitle: feed.title, sourceId: source.id },
          });
          existingSourceUrls.add(link);
        }

        if (toInsert.length === 0) {
          await log.info("No new signals (all duplicates)", { sourceId: source.id, name: source.name });
          await supabase.from("pipeline_runs").update({
            status: "completed", signals_found: 0, completed_at: new Date().toISOString(),
          }).eq("id", runId!);
          await supabase.from("data_sources").update({ last_scanned_at: new Date().toISOString() }).eq("id", source.id);
          return { signalIds: [] as string[], runId };
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

        await supabase.from("pipeline_runs").update({
          status: "completed", signals_found: signalIds.length, completed_at: new Date().toISOString(),
        }).eq("id", runId!);
        await supabase.from("data_sources").update({ last_scanned_at: new Date().toISOString() }).eq("id", source.id);

        return { signalIds, runId };
      });

      if (signalIds?.length) allSignalIds.push(...signalIds);
    }

    await log.info("All sources scanned", { sourcesCount: sources.length, totalNewSignals: allSignalIds.length });

    if (allSignalIds.length > 0) {
      await step.sendEvent("emit-batch-collected", [
        { name: "signal/batch.collected", data: { signalIds: allSignalIds } },
      ]);
      await log.info("Emitted signal/batch.collected", { count: allSignalIds.length });
    }

    if (jobRun?.id) {
      await supabase.from("pipeline_runs").update({
        status: "completed",
        signals_found: allSignalIds.length,
        completed_at: new Date().toISOString(),
      }).eq("id", jobRun.id);
    }

    await log.info("Pipeline run complete", { totalSignals: allSignalIds.length });
    return { scanned: sources.length, signalIds: allSignalIds };
  }
);
