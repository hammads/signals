import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";
import { buildDigestPrompt } from "@/lib/ai/prompts";
import type { SignalMatchWithSignal } from "@/types/database";

export const compileDigest = inngest.createFunction(
  {
    id: "compile-digest",
    retries: 2,
  },
  { cron: "0 18 * * 0" },
  async ({ step }) => {
    const supabase = await createServiceClient();

    const weekEnd = new Date();
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    const periodStart = weekStart.toISOString().slice(0, 10);
    const periodEnd = weekEnd.toISOString().slice(0, 10);

    const users = await step.run("fetch-users-with-matches", async () => {
      const { data, error } = await supabase
        .from("signal_matches")
        .select("user_id")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());
      if (error) throw error;

      const userIds = [...new Set((data ?? []).map((r) => (r as { user_id: string }).user_id))];
      return userIds;
    });

    if (!users?.length) return { digestsCreated: 0 };

    let digestsCreated = 0;

    for (const userId of users) {
      await step.run(`compile-digest-${userId}`, async () => {
        const { data: matches, error: matchesError } = await supabase
          .from("signal_matches")
          .select(
            `
            id,
            signal_id,
            user_id,
            relevance_score,
            why_it_matters,
            action_suggestion,
            signal:signals(*)
          `
          )
          .eq("user_id", userId)
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString());

        if (matchesError || !matches?.length) return;

        const matchesWithSignal = matches as unknown as SignalMatchWithSignal[];

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: buildDigestPrompt(matchesWithSignal),
        });

        const { error: insertError } = await supabase.from("digests").insert({
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          summary_markdown: text,
          signal_match_ids: matchesWithSignal.map((m) => m.id),
        });

        if (!insertError) digestsCreated++;
      });
    }

    return { digestsCreated };
  }
);
