import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { DataSourceType } from "@/types/database";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, serviceClient };
}

export interface DataSourceSuggestion {
  name: string;
  source_type: DataSourceType;
  config: Record<string, unknown>;
  description?: string;
}

const SUPPORTED_SOURCE_TYPES: DataSourceType[] = ["rss", "ai_search"];

function parseSuggestions(text: string): DataSourceSuggestion[] {
  const suggestions: DataSourceSuggestion[] = [];
  try {
    // Try to extract JSON array from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as unknown[];
      for (const item of parsed) {
        if (item && typeof item === "object" && "name" in item && typeof (item as { name: unknown }).name === "string") {
          const obj = item as Record<string, unknown>;
          const sourceType = typeof obj.source_type === "string" && SUPPORTED_SOURCE_TYPES.includes(obj.source_type as DataSourceType)
            ? (obj.source_type as DataSourceType)
            : "rss";
          const config = obj.config && typeof obj.config === "object" ? (obj.config as Record<string, unknown>) : {};
          suggestions.push({
            name: String(obj.name),
            source_type: sourceType,
            config,
            description: typeof obj.description === "string" ? obj.description : undefined,
          });
        }
      }
    }
  } catch {
    // Fallback: return empty if parsing fails
  }
  return suggestions;
}

export async function POST(request: Request) {
  try {
    const result = await requireAdmin();
    if ("error" in result) return result.error;

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Query must be at least 3 characters" },
        { status: 400 }
      );
    }

    const { text, sources } = await generateText({
      model: openai("gpt-4o-mini"),
      tools: {
        web_search: openai.tools.webSearch({
          searchContextSize: "medium",
        }),
      },
      toolChoice: { type: "tool", toolName: "web_search" },
      system: `You are a research assistant finding data sources for a K-12 education signals platform. 
The platform scans sources for funding, grants, RFPs, board minutes, policy, and EdTech news.

When given a topic, search the web for relevant data sources. Return a JSON array of suggestions.
Each suggestion must have:
- name: short display name (e.g. "EdWeek RSS")
- source_type: one of "rss" or "ai_search" (only these are supported)
- config: object with type-specific fields:
  - rss: { "url": "https://..." } - the RSS/Atom feed URL
  - ai_search: { "query_template": "search query template" }
- description: optional one-line description

Prioritize: RSS feeds from education news (EdWeek, EdSurge, etc.) and searchable sources for board minutes, grants, RFPs.
Only suggest real, verifiable sources. Return ONLY a valid JSON array, no other text.`,
      prompt: `Find 5-8 data sources for: "${query}"

Search the web for RSS feeds, APIs, and other public data sources. Return a JSON array.`,
    });

    const parsed = parseSuggestions(text);
    // Only return supported types (api/scrape not implemented yet)
    const suggestions = parsed.filter((s) => SUPPORTED_SOURCE_TYPES.includes(s.source_type));

    // Enrich with source URLs from web search when parsing fails
    const sourceUrls: Array<{ url: string; title?: string }> = [];
    for (const s of sources ?? []) {
      const src = s as { url?: string; title?: string };
      if (src?.url && typeof src.url === "string") {
        sourceUrls.push({ url: src.url, title: src.title });
      }
    }
    if (suggestions.length === 0 && sourceUrls.length > 0) {
      for (const s of sourceUrls.slice(0, 8)) {
        if (s.url && (s.url.includes("/feed") || s.url.endsWith(".xml") || s.url.includes("rss") || s.url.includes("atom"))) {
          suggestions.push({
            name: s.title ?? new URL(s.url).hostname,
            source_type: "rss",
            config: { url: s.url },
          });
        }
      }
    }

    return NextResponse.json({ suggestions, sources: sourceUrls });
  } catch (err) {
    console.error("Data source suggest error:", err);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
