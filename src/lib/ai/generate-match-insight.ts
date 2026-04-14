import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildMatchPrompt } from "@/lib/ai/prompts";
import {
  signalMatchInsightSchema,
  type SignalMatchInsight,
} from "@/types/schemas";
import type { Signal, SignalProfile } from "@/types/database";

/**
 * LLM-generated “blurb” for a signal–profile pair (why it matters + suggested action).
 * Vector matching runs separately; this is for on-demand or batch enrichment.
 */
export async function generateSignalMatchInsight(params: {
  signal: Signal;
  profile: SignalProfile;
  districtLabels?: string[];
}): Promise<SignalMatchInsight> {
  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: signalMatchInsightSchema,
    prompt: buildMatchPrompt(params.signal, params.profile, params.districtLabels),
  });
  return result.object;
}
