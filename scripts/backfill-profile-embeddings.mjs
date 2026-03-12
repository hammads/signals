#!/usr/bin/env node
/**
 * Backfill profile_embedding for signal_profiles that don't have one.
 * Run: node scripts/backfill-profile-embeddings.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { embed } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch (_) {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildProfileEmbeddingText(profile) {
  const parts = [];
  if (profile.keywords?.length) parts.push(`Keywords: ${profile.keywords.join(", ")}`);
  if (profile.problem_areas?.length) parts.push(`Problem areas: ${profile.problem_areas.join(", ")}`);
  if (profile.solution_categories?.length) parts.push(`Solution categories: ${profile.solution_categories.join(", ")}`);
  if (profile.funding_sources?.length) parts.push(`Funding sources: ${profile.funding_sources.join(", ")}`);
  if (profile.competitor_names?.length) parts.push(`Competitors: ${profile.competitor_names.join(", ")}`);
  if (profile.target_regions?.length) parts.push(`Target regions: ${profile.target_regions.join(", ")}`);
  if (profile.district_types?.length) parts.push(`District types: ${profile.district_types.join(", ")}`);
  if (profile.bellwether_districts?.length) parts.push(`Bellwether districts: ${profile.bellwether_districts.join(", ")}`);
  return parts.join(". ");
}

async function main() {
  const { data: profiles, error: fetchError } = await supabase
    .from("signal_profiles")
    .select("id, user_id, keywords, target_regions, district_types, district_size_range, problem_areas, solution_categories, funding_sources, competitor_names, bellwether_districts")
    .is("profile_embedding", null);

  if (fetchError) {
    console.error("Failed to fetch profiles:", fetchError.message);
    process.exit(1);
  }

  if (!profiles?.length) {
    console.log("No profiles need backfilling.");
    return;
  }

  console.log(`Backfilling ${profiles.length} profile(s)...`);

  for (const profile of profiles) {
    const text = buildProfileEmbeddingText(profile);
    if (!text.trim()) {
      console.log(`  Skipping ${profile.id} (no profile content)`);
      continue;
    }

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: text,
    });

    const { error: updateError } = await supabase
      .from("signal_profiles")
      .update({ profile_embedding: embedding })
      .eq("id", profile.id);

    if (updateError) {
      console.error(`  Failed ${profile.id}:`, updateError.message);
    } else {
      console.log(`  ✓ Updated ${profile.id}`);
    }
  }

  // Emit signal/embeddings.ready for signals that already have embeddings,
  // so summarize-signals will create signal_matches for the newly backfilled profiles.
  const { data: signalsWithEmbeddings } = await supabase
    .from("signals")
    .select("id")
    .not("content_embedding", "is", null);

  if (signalsWithEmbeddings?.length && (process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV)) {
    const { Inngest } = await import("inngest");
    process.env.INNGEST_DEV = process.env.INNGEST_DEV || "1";
    const inngest = new Inngest({ id: "ai-signals-radar" });
    const signalIds = signalsWithEmbeddings.map((s) => s.id);
    for (let i = 0; i < signalIds.length; i += 10) {
      const chunk = signalIds.slice(i, i + 10);
      await inngest.send({ name: "signal/embeddings.ready", data: { signalIds: chunk } });
    }
    console.log(`Triggered summarize-signals for ${signalIds.length} signals. Check Inngest UI at http://localhost:8288`);
  } else if (signalsWithEmbeddings?.length) {
    console.log(`${signalsWithEmbeddings.length} signals have embeddings. Run with dev server (pnpm dev) and INNGEST_DEV=1 to trigger matching.`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
