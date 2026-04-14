import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { createPipelineLogger } from "@/lib/inngest/pipeline-logger";
import type { DataSource, Signal } from "@/types/database";
import type { SignalCategory } from "@/types/database";

const CATEGORY_KEYWORDS: Record<string, SignalCategory> = {
  grant: "grant",
  rfp: "rfp",
  "request for proposal": "rfp",
  solicitation: "rfp",
  bid: "rfp",
  "board meeting": "board_minutes",
  "board minutes": "board_minutes",
  "board agenda": "board_minutes",
  policy: "policy",
  legislation: "policy",
  competitor: "competitor",
  news: "news",
};

function inferCategory(title: string): SignalCategory | null {
  const lower = title.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category;
  }
  return null;
}

const listingItemSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().describe("Title or headline of the individual listing item"),
      url: z.string().describe("Absolute URL to the item detail page, or empty string if not available"),
      date: z.string().optional().describe("Publication or posting date if visible, ISO-8601 or natural language"),
      snippet: z.string().optional().describe("Brief description, summary, or excerpt of the item (1-3 sentences)"),
    })
  ),
});

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SignalsBot/1.0; +https://signals.example.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const html = await res.text();
  return stripHtmlToText(html).slice(0, 50_000);
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const scanScrape = inngest.createFunction(
  {
    id: "scan-scrape",
    retries: 2,
    timeouts: { finish: "15m" },
  },
  [
    { cron: "0 */8 * * *" },
    { event: "pipeline/scan.scrape" },
    { event: "pipeline/scan.scrape.source" },
  ],
  async ({ step, event, logger: inngestLogger }) => {
    const supabase = await createServiceClient();
    const dataSourceId =
      event?.name === "pipeline/scan.scrape.source"
        ? (event.data as { data_source_id?: string })?.data_source_id
        : undefined;

    inngestLogger.info("[scan-scrape] Starting scrape pipeline scan", {
      trigger: event?.name ?? "cron",
      dataSourceId: dataSourceId ?? "all",
    });

    const jobRun = await step.run("create-pipeline-run", async () => {
      const { data } = await supabase
        .from("pipeline_runs")
        .insert({
          data_source_id: null,
          pipeline_type: "scrape",
          status: "running",
          signals_found: 0,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      return data;
    });

    const log = createPipelineLogger(supabase, jobRun?.id, inngestLogger);
    await log.info("Scrape pipeline started", {
      trigger: event?.name ?? "cron",
      runId: jobRun?.id,
    });

    const sources = await step.run("fetch-scrape-sources", async () => {
      if (dataSourceId) {
        const { data, error } = await supabase
          .from("data_sources")
          .select("*")
          .eq("id", dataSourceId)
          .eq("source_type", "scrape")
          .single();
        if (error || !data) {
          await log.warn("Data source not found or not scrape type", {
            dataSourceId,
            error: error?.message,
          });
          return [] as DataSource[];
        }
        await log.info("Fetched single data source", { name: data.name });
        return [data] as DataSource[];
      }
      const { data, error } = await supabase
        .from("data_sources")
        .select("*")
        .eq("source_type", "scrape")
        .eq("is_active", true);
      if (error) throw error;
      await log.info("Fetched active scrape sources", {
        count: data?.length ?? 0,
      });
      return (data ?? []) as DataSource[];
    });

    if (!sources?.length) {
      await log.warn("No active scrape sources found — completing early");
      if (jobRun?.id) {
        await supabase
          .from("pipeline_runs")
          .update({
            status: "completed",
            signals_found: 0,
            completed_at: new Date().toISOString(),
            error_message: "No active scrape sources configured",
          })
          .eq("id", jobRun.id);
      }
      return { scanned: 0, signalIds: [] };
    }

    const allSignalIds: string[] = [];

    for (const source of sources) {
      const config = source.config as {
        url?: string;
        category_hint?: string;
      };
      const url = config?.url;
      if (!url || typeof url !== "string") {
        await log.warn("Skipping source with no URL", {
          sourceId: source.id,
          name: source.name,
        });
        continue;
      }

      await log.info("Scraping listing page", {
        sourceId: source.id,
        name: source.name,
        url,
      });

      const { signalIds } = await step.run(
        `scrape-source-${source.id}`,
        async () => {
          let pageText: string;
          try {
            pageText = await fetchPageText(url);
          } catch (err) {
            await log.error("Failed to fetch page", {
              sourceId: source.id,
              name: source.name,
              url,
              error: err instanceof Error ? err.message : String(err),
            });
            throw err;
          }

          if (pageText.length < 100) {
            await log.info("Page content too short, likely empty", {
              sourceId: source.id,
              name: source.name,
              length: pageText.length,
            });
            return { signalIds: [] as string[], runId: null as string | null };
          }

          await log.info("Page fetched, extracting items with LLM", {
            sourceId: source.id,
            name: source.name,
            contentLength: pageText.length,
          });

          const categoryHint = config.category_hint ?? "";
          const { object: extracted } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: listingItemSchema,
            prompt: `You are extracting individual listing items from a web page that serves as a directory or feed of items (e.g., RFPs, grants, bids, news articles, funding awards).

Page URL: ${url}
Source name: ${source.name}
${categoryHint ? `Category hint: ${categoryHint}` : ""}

Extract every distinct listing item you can find. For each item provide:
- title: the item's title or headline
- url: the absolute URL to the item's detail page (resolve relative URLs against ${url}). If no link is available, use an empty string.
- date: the posting/publication date if visible
- snippet: a 1-3 sentence summary of the item

Only extract actual listing items (bids, RFPs, grants, articles, opportunities, etc.), not navigation links, ads, or boilerplate. Return up to 50 items, prioritizing the most recent.

Page content:
${pageText.slice(0, 30_000)}`,
          });

          const items = extracted.items.filter((i) => i.title?.trim());
          await log.info("LLM extracted items", {
            sourceId: source.id,
            name: source.name,
            itemCount: items.length,
          });

          if (items.length === 0) {
            await log.info("No items extracted from page", {
              sourceId: source.id,
              name: source.name,
            });
            await supabase
              .from("data_sources")
              .update({ last_scanned_at: new Date().toISOString() })
              .eq("id", source.id);
            return { signalIds: [] as string[], runId: null as string | null };
          }

          // Deduplicate: check by source_url for items that have one,
          // and by title for items without a URL
          const itemUrls = items
            .map((i) => i.url)
            .filter((u) => u && u.length > 0);
          const { data: existingByUrl } = itemUrls.length
            ? await supabase
                .from("signals")
                .select("source_url")
                .in("source_url", itemUrls)
            : { data: [] };
          const existingUrlSet = new Set(
            (existingByUrl ?? []).map(
              (r) => (r as { source_url: string }).source_url
            )
          );

          const itemTitlesNoUrl = items
            .filter((i) => !i.url || i.url.length === 0)
            .map((i) => i.title);
          const { data: existingByTitle } = itemTitlesNoUrl.length
            ? await supabase
                .from("signals")
                .select("title")
                .in("title", itemTitlesNoUrl)
                .eq("source_type", "scrape")
            : { data: [] };
          const existingTitleSet = new Set(
            (existingByTitle ?? []).map(
              (r) => (r as { title: string }).title
            )
          );

          await log.info("Deduplication check", {
            sourceId: source.id,
            name: source.name,
            totalItems: items.length,
            existingByUrl: existingUrlSet.size,
            existingByTitle: existingTitleSet.size,
          });

          const { data: run } = await supabase
            .from("pipeline_runs")
            .insert({
              data_source_id: source.id,
              pipeline_type: "scrape",
              parent_run_id: jobRun?.id ?? null,
              status: "running",
              signals_found: 0,
              started_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          const runId = run?.id ?? null;

          const toInsert: Omit<
            Signal,
            "id" | "created_at" | "content_embedding"
          >[] = [];
          const seenUrls = new Set(existingUrlSet);
          const seenTitles = new Set(existingTitleSet);

          for (const item of items) {
            const hasUrl = item.url && item.url.length > 0;
            if (hasUrl && seenUrls.has(item.url)) continue;
            if (!hasUrl && seenTitles.has(item.title)) continue;

            toInsert.push({
              source_type: "scrape",
              source_url: hasUrl ? item.url : null,
              title: item.title,
              raw_content: item.snippet ?? null,
              published_at: item.date ?? null,
              region: null,
              signal_category:
                inferCategory(item.title) ??
                inferCategory(categoryHint) ??
                null,
              metadata: {
                parentSourceName: source.name,
                parentSourceUrl: url,
                sourceId: source.id,
              },
            });

            if (hasUrl) seenUrls.add(item.url);
            else seenTitles.add(item.title);
          }

          if (toInsert.length === 0) {
            await log.info("No new signals (all duplicates)", {
              sourceId: source.id,
              name: source.name,
            });
            await supabase
              .from("pipeline_runs")
              .update({
                status: "completed",
                signals_found: 0,
                completed_at: new Date().toISOString(),
              })
              .eq("id", runId!);
            await supabase
              .from("data_sources")
              .update({ last_scanned_at: new Date().toISOString() })
              .eq("id", source.id);
            return { signalIds: [] as string[], runId };
          }

          const { data: inserted, error: insertError } = await supabase
            .from("signals")
            .insert(toInsert)
            .select("id");

          if (insertError) {
            await log.error("Failed to insert signals", {
              sourceId: source.id,
              name: source.name,
              count: toInsert.length,
              error: insertError.message,
            });
            throw insertError;
          }

          const signalIds = (inserted ?? []).map((r) => r.id);
          await log.info("Inserted new signals", {
            sourceId: source.id,
            name: source.name,
            count: signalIds.length,
          });

          await supabase
            .from("pipeline_runs")
            .update({
              status: "completed",
              signals_found: signalIds.length,
              completed_at: new Date().toISOString(),
            })
            .eq("id", runId!);
          await supabase
            .from("data_sources")
            .update({ last_scanned_at: new Date().toISOString() })
            .eq("id", source.id);

          return { signalIds, runId };
        }
      );

      if (signalIds?.length) allSignalIds.push(...signalIds);
    }

    await log.info("All sources scraped", {
      sourcesCount: sources.length,
      totalNewSignals: allSignalIds.length,
    });

    if (allSignalIds.length > 0) {
      await step.sendEvent("emit-batch-collected", [
        {
          name: "signal/batch.collected",
          data: { signalIds: allSignalIds },
        },
      ]);
      await log.info("Emitted signal/batch.collected", {
        count: allSignalIds.length,
      });
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

    await log.info("Pipeline run complete", {
      totalSignals: allSignalIds.length,
    });
    return { scanned: sources.length, signalIds: allSignalIds };
  }
);
