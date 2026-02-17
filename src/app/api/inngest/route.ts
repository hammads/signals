import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { scanRSS } from "@/lib/inngest/functions/scan-rss";
import { scanSamGov } from "@/lib/inngest/functions/scan-sam-gov";
import { scanAISearch } from "@/lib/inngest/functions/scan-ai-search";
import { generateEmbeddings } from "@/lib/inngest/functions/generate-embeddings";
import { summarizeSignals } from "@/lib/inngest/functions/summarize-signals";
import { compileDigest } from "@/lib/inngest/functions/compile-digest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scanRSS,
    scanSamGov,
    scanAISearch,
    generateEmbeddings,
    summarizeSignals,
    compileDigest,
  ],
});
