import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";

const classificationSchema = z.object({
  results: z.array(
    z.object({
      signal_id: z.string(),
      is_listing: z.boolean().describe(
        "True if this page is a directory, feed, catalog, or search-results page containing multiple distinct items (RFPs, bids, grants, opportunities, articles, etc). False if it is a single article, press release, blog post, or individual document."
      ),
      category_hint: z
        .string()
        .optional()
        .describe(
          "If is_listing is true, a short keyword for the type of items (e.g. rfp, grant, news, bid)"
        ),
    })
  ),
});

/**
 * After Tavily inserts new signals, this function checks whether any of them
 * are listing/directory pages. If so, it auto-creates a `scrape` data source
 * so that individual items get extracted on future scans.
 */
export const promoteListingSignals = inngest.createFunction(
  {
    id: "promote-listing-signals",
    retries: 1,
    timeouts: { finish: "5m" },
  },
  { event: "signal/ai-search.completed" },
  async ({ event, step, logger }) => {
    const { signalIds } = event.data as { signalIds: string[] };
    if (!signalIds?.length) return { promoted: 0 };

    const supabase = await createServiceClient();

    const signals = await step.run("load-ai-search-signals", async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("id, title, source_url, raw_content")
        .in("id", signalIds)
        .eq("source_type", "ai_search");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        title: string;
        source_url: string | null;
        raw_content: string | null;
      }>;
    });

    const candidates = signals.filter((s) => s.source_url);
    if (!candidates.length) return { promoted: 0 };

    const classification = await step.run("classify-listing-pages", async () => {
      const summaries = candidates.map((s) => ({
        signal_id: s.id,
        url: s.source_url!,
        title: s.title,
        content_preview: (s.raw_content ?? "").slice(0, 500),
      }));

      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: classificationSchema,
        prompt: `You are classifying web pages found by a search engine. For each page below, determine if it is a **listing/directory page** or a **single-content page**.

A listing/directory page contains multiple distinct items such as:
- A list of RFPs, bids, or solicitations
- A directory of grants or funding opportunities
- A catalog of news articles, blog posts, or press releases
- Search results or filtered views showing many items
- A feed or index page with multiple entries

A single-content page is:
- An individual article, blog post, or press release
- A single RFP or grant detail page
- A product page or about page
- A PDF or document viewer

Pages to classify:
${summaries.map((s, i) => `${i + 1}. signal_id: ${s.signal_id}\n   URL: ${s.url}\n   Title: ${s.title}\n   Content preview: ${s.content_preview}`).join("\n\n")}

For each page, return is_listing (true/false) and an optional category_hint if it is a listing.`,
      });

      return object.results;
    });

    const listings = classification.filter((r) => r.is_listing);
    if (!listings.length) {
      logger.info("[promote-listing-signals] No listing pages found", {
        classified: candidates.length,
      });
      return { promoted: 0 };
    }

    const promoted = await step.run("create-scrape-sources", async () => {
      const listingSignalIds = new Set(listings.map((l) => l.signal_id));
      const listingSignals = candidates.filter((s) =>
        listingSignalIds.has(s.id)
      );

      // Check which URLs already have a scrape data source
      const urls = listingSignals.map((s) => s.source_url!);
      const { data: existingSources } = await supabase
        .from("data_sources")
        .select("config")
        .eq("source_type", "scrape")
        .eq("is_active", true);

      const existingUrls = new Set(
        (existingSources ?? [])
          .map((ds) => {
            const cfg = ds.config as { url?: string } | null;
            return cfg?.url ?? "";
          })
          .filter(Boolean)
      );

      const newSources: Array<{
        name: string;
        source_type: "scrape";
        config: Record<string, unknown>;
        is_active: boolean;
        scan_frequency_hours: number;
      }> = [];

      for (const signal of listingSignals) {
        if (existingUrls.has(signal.source_url!)) continue;

        const match = listings.find((l) => l.signal_id === signal.id);
        newSources.push({
          name: signal.title,
          source_type: "scrape",
          config: {
            url: signal.source_url!,
            category_hint: match?.category_hint ?? "",
            auto_promoted: true,
          },
          is_active: true,
          scan_frequency_hours: 24,
        });
        existingUrls.add(signal.source_url!);
      }

      if (!newSources.length) return [] as string[];

      const { data: inserted, error } = await supabase
        .from("data_sources")
        .insert(newSources)
        .select("id");
      if (error) throw error;
      return (inserted ?? []).map((r) => r.id) as string[];
    });

    // Trigger an immediate scrape for each newly created source
    if (promoted.length > 0) {
      await step.sendEvent(
        "trigger-scrape-for-promoted",
        promoted.map((dsId) => ({
          name: "pipeline/scan.scrape.source" as const,
          data: { data_source_id: dsId },
        }))
      );

      logger.info("[promote-listing-signals] Promoted listing pages to scrape sources", {
        count: promoted.length,
      });
    }

    return { promoted: promoted.length };
  }
);
