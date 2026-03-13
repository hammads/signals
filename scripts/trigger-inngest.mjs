#!/usr/bin/env node
/**
 * Dev-only script to trigger Inngest pipeline scans.
 * Run with: INNGEST_DEV=1 node scripts/trigger-inngest.mjs
 * Requires: pnpm dev (Next.js + Inngest) running
 */
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
} catch {}

process.env.INNGEST_DEV = process.env.INNGEST_DEV || "1";

const { Inngest } = await import("inngest");
const inngest = new Inngest({ id: "ai-signals-radar" });

async function main() {
  console.log("Triggering Inngest pipeline scans...\n");

  const events = [
    { name: "pipeline/scan.rss" },
    { name: "pipeline/scan.sam-gov" },
    { name: "pipeline/scan.ai-search" },
  ];

  try {
    const { ids } = await inngest.send(events);
    console.log("✓ Events sent:", ids);
  } catch (err) {
    console.error("✗ Failed:", err.message);
    process.exit(1);
  }

  console.log("\nCheck Inngest dev UI at http://localhost:8288 for run status.");
  console.log("Check Supabase signals + pipeline_runs tables for stored data.");
}

main().catch(console.error);
