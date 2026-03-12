import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { scanRSS } from "@/lib/inngest/functions/scan-rss";
import { scanSamGov } from "@/lib/inngest/functions/scan-sam-gov";
import { scanAISearch } from "@/lib/inngest/functions/scan-ai-search";
import { generateEmbeddings } from "@/lib/inngest/functions/generate-embeddings";
import { summarizeSignals } from "@/lib/inngest/functions/summarize-signals";
import { reMatchProfile } from "@/lib/inngest/functions/re-match-profile";
import { compileDigest } from "@/lib/inngest/functions/compile-digest";
import { expireStaleRuns } from "@/lib/inngest/functions/expire-stale-runs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scanRSS,
    scanSamGov,
    scanAISearch,
    generateEmbeddings,
    summarizeSignals,
    reMatchProfile,
    compileDigest,
    expireStaleRuns,
  ],
});
