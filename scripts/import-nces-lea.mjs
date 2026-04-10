#!/usr/bin/env node
/**
 * NCES CCD LEA Import Script
 *
 * Downloads the NCES Common Core of Data (CCD) Local Education Agency (LEA)
 * universe file and upserts all records into `lea_directory`.
 *
 * NCES CCD file: https://nces.ed.gov/ccd/files.asp
 * Latest LEA universe (2022-23):
 *   https://nces.ed.gov/ccd/data/zip/ccd_lea_029_2223_w_0a_220603.zip
 *   CSV inside zip: ccd_lea_029_2223_w_0a_220603.csv
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
 *   node scripts/import-nces-lea.mjs
 *
 * Or against a local Supabase instance:
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=your_local_anon_or_service_key \
 *   node scripts/import-nces-lea.mjs
 */

import { createClient } from "@supabase/supabase-js";
import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createUnzip } from "node:zlib";
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// NCES CCD 2022-23 LEA Universe File (public, no auth required)
// Check https://nces.ed.gov/ccd/files.asp for the latest version.
const NCES_ZIP_URL =
  "https://nces.ed.gov/ccd/data/zip/ccd_lea_029_2223_w_0a_220603.zip";
const TMP_DIR = path.join(process.cwd(), ".tmp-nces");
const ZIP_PATH = path.join(TMP_DIR, "nces_lea.zip");
const EXTRACT_DIR = path.join(TMP_DIR, "nces_lea_extracted");

const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Download a URL to a local file path. */
async function download(url, dest) {
  console.log(`Downloading ${url}…`);
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const file = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    }).on("error", reject);
  });
  console.log(`Saved to ${dest}`);
}

/** Extract the first CSV from a zip file (using native streams + zlib). */
async function extractZip(zipPath, outDir) {
  console.log(`Extracting ${zipPath}…`);
  await fs.promises.mkdir(outDir, { recursive: true });
  // Use the system unzip command for simplicity — available everywhere
  const { execSync } = await import("node:child_process");
  execSync(`unzip -o "${zipPath}" "*.csv" -d "${outDir}"`, { stdio: "inherit" });
}

/** Find the first CSV in a directory tree. */
async function findFirstCsv(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const found = await findFirstCsv(path.join(dir, entry.name));
      if (found) return found;
    } else if (entry.name.endsWith(".csv")) {
      return path.join(dir, entry.name);
    }
  }
  return null;
}

/**
 * Parse the NCES CSV and yield batches of { lea_id, state, name } objects.
 *
 * NCES CCD LEA Universe column names (may vary by year):
 *   LEAID  – 7-digit NCES ID
 *   STABBR – 2-letter state
 *   NAME   – LEA name
 */
async function* parseCsv(csvPath) {
  const parser = createReadStream(csvPath).pipe(
    parse({ columns: true, trim: true, skip_empty_lines: true })
  );

  let batch = [];
  for await (const row of parser) {
    const leaId = (row["LEAID"] ?? row["leaid"] ?? "").trim();
    const state = (row["STABBR"] ?? row["stabbr"] ?? row["ST"] ?? "").trim().toUpperCase();
    const name = (row["NAME"] ?? row["name"] ?? row["LEANM"] ?? "").trim();
    if (!leaId || !state || !name) continue;

    batch.push({ lea_id: leaId, state, name });
    if (batch.length >= BATCH_SIZE) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) yield batch;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Download
  if (!fs.existsSync(ZIP_PATH)) {
    await download(NCES_ZIP_URL, ZIP_PATH);
  } else {
    console.log(`Using cached zip: ${ZIP_PATH}`);
  }

  // 2. Extract
  await extractZip(ZIP_PATH, EXTRACT_DIR);

  // 3. Find CSV
  const csvPath = await findFirstCsv(EXTRACT_DIR);
  if (!csvPath) {
    console.error("No CSV found in extracted zip.");
    process.exit(1);
  }
  console.log(`Parsing ${csvPath}…`);

  // 4. Upsert in batches
  let total = 0;
  for await (const batch of parseCsv(csvPath)) {
    const { error } = await supabase
      .from("lea_directory")
      .upsert(batch, { onConflict: "lea_id" });
    if (error) {
      console.error("Upsert error:", error.message);
      process.exit(1);
    }
    total += batch.length;
    process.stdout.write(`\rUpserted ${total} LEAs…`);
  }
  console.log(`\nDone. Total LEAs imported: ${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
