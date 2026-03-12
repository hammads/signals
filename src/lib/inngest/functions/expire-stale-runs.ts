import { inngest } from "@/lib/inngest/client";
import { createServiceClient } from "@/lib/supabase/server";

const STALE_THRESHOLD_MINUTES = 30;

export const expireStaleRuns = inngest.createFunction(
  {
    id: "expire-stale-pipeline-runs",
    retries: 0,
  },
  { cron: "*/30 * * * *" },
  async ({ step, logger }) => {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    logger.info("[expire-stale-runs] Checking for stale pipeline runs", {
      cutoff,
      thresholdMinutes: STALE_THRESHOLD_MINUTES,
    });

    const { count, error } = await step.run("mark-stale-runs-failed", async () => {
      const supabase = await createServiceClient();

      const { data, error } = await supabase
        .from("pipeline_runs")
        .update({
          status: "failed",
          error_message: `Timed out: still running after ${STALE_THRESHOLD_MINUTES} minutes`,
          completed_at: new Date().toISOString(),
        })
        .in("status", ["running", "pending"])
        .lt("created_at", cutoff)
        .select("id");

      if (error) throw error;

      return { count: data?.length ?? 0 };
    });

    if (error) {
      logger.error("[expire-stale-runs] Failed to expire stale runs", { error });
      return { expired: 0 };
    }

    if (count > 0) {
      logger.warn("[expire-stale-runs] Expired stale pipeline runs", { count });
    } else {
      logger.info("[expire-stale-runs] No stale runs found");
    }

    return { expired: count };
  }
);
