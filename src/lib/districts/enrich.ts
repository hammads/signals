import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const districtMentionSchema = z.object({
  mentions: z
    .array(
      z.object({
        districtName: z.string().describe("The name of the K-12 district as mentioned in the text"),
        state: z
          .string()
          .nullable()
          .describe("2-letter US state abbreviation if identifiable, otherwise null"),
      })
    )
    .max(8)
    .describe("Up to 8 K-12 district mentions found in the signal"),
});

export type DistrictMention = z.infer<typeof districtMentionSchema>["mentions"][number];

// ---------------------------------------------------------------------------
// Extract step: use LLM to pull district mentions out of signal text
// ---------------------------------------------------------------------------

export async function extractDistrictMentions(signal: {
  title: string;
  raw_content?: string | null;
  region?: string | null;
}): Promise<DistrictMention[]> {
  const content = [signal.title, signal.raw_content].filter(Boolean).join("\n\n");
  if (content.trim().length < 40) return [];

  const truncated =
    content.length > 4000 ? content.slice(0, 4000) + "…" : content;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: districtMentionSchema,
    prompt: `Extract all K-12 school district names mentioned in the following educational market signal. For each district include the 2-letter US state abbreviation if you can determine it from context.

Signal text:
${truncated}`,
  });

  return object.mentions;
}

// ---------------------------------------------------------------------------
// Resolve step: fuzzy-match each mention against lea_directory via Supabase RPC
// ---------------------------------------------------------------------------

const MATCH_THRESHOLD = 0.35;

export interface ResolvedDistrict {
  lea_id: string;
  name: string;
  state: string;
  score: number;
  extracted_text: string;
}

export async function resolveDistricts(
  mentions: DistrictMention[],
  signalRegion: string | null | undefined,
  supabase: SupabaseClient
): Promise<ResolvedDistrict[]> {
  const resolved: ResolvedDistrict[] = [];

  for (const mention of mentions) {
    const stateHint =
      mention.state ??
      (signalRegion && /^[A-Z]{2}$/.test(signalRegion) ? signalRegion : null);

    if (!stateHint) continue;

    const { data, error } = await supabase.rpc("match_lea_directory", {
      p_state: stateHint.toUpperCase(),
      p_query: mention.districtName,
      p_limit: 1,
    });

    if (error || !data?.length) continue;

    const best = data[0] as { lea_id: string; name: string; state: string; score: number };
    if (best.score >= MATCH_THRESHOLD) {
      // Avoid duplicates (same lea_id from different mentions)
      if (!resolved.find((r) => r.lea_id === best.lea_id)) {
        resolved.push({
          lea_id: best.lea_id,
          name: best.name,
          state: best.state,
          score: best.score,
          extracted_text: mention.districtName,
        });
      }
    }
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// Persist step: idempotent upsert into signal_districts
// ---------------------------------------------------------------------------

export async function persistSignalDistricts(
  signalId: string,
  resolved: ResolvedDistrict[],
  supabase: SupabaseClient
): Promise<void> {
  // Delete stale rows first so re-runs are idempotent
  await supabase.from("signal_districts").delete().eq("signal_id", signalId);

  if (!resolved.length) return;

  const rows = resolved.map((r) => ({
    signal_id: signalId,
    lea_id: r.lea_id,
    extracted_text: r.extracted_text,
    match_score: r.score,
  }));

  const { error } = await supabase.from("signal_districts").insert(rows);
  if (error) throw new Error(`Failed to persist signal_districts: ${error.message}`);
}

// ---------------------------------------------------------------------------
// High-level orchestrator: extract → resolve → persist
// ---------------------------------------------------------------------------

export async function enrichSignalWithDistricts(
  signal: {
    id: string;
    title: string;
    raw_content?: string | null;
    region?: string | null;
  },
  supabase: SupabaseClient
): Promise<{ resolved: ResolvedDistrict[]; skipped: boolean }> {
  const mentions = await extractDistrictMentions(signal);
  if (!mentions.length) return { resolved: [], skipped: true };

  const resolved = await resolveDistricts(mentions, signal.region, supabase);
  await persistSignalDistricts(signal.id, resolved, supabase);

  return { resolved, skipped: false };
}
