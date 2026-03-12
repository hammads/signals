import type { SupabaseClient } from "@supabase/supabase-js";

type LogLevel = "info" | "warn" | "error";

interface InngestLogger {
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
}

export function createPipelineLogger(
  supabase: SupabaseClient,
  runId: string | null | undefined,
  inngestLogger: InngestLogger
) {
  async function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    // Always emit to Inngest logger (shows in Inngest dashboard)
    const inngestArgs = data ? [data] : [];
    inngestLogger[level](message, ...inngestArgs);

    // Write to DB so the admin UI can display it
    if (!runId) return;
    try {
      await supabase.from("pipeline_run_logs").insert({
        run_id: runId,
        level,
        message,
        data: data ?? null,
      });
    } catch {
      // Never let logging failures break the pipeline
    }
  }

  return {
    info: (message: string, data?: Record<string, unknown>) => log("info", message, data),
    warn: (message: string, data?: Record<string, unknown>) => log("warn", message, data),
    error: (message: string, data?: Record<string, unknown>) => log("error", message, data),
  };
}

export type PipelineLogger = ReturnType<typeof createPipelineLogger>;
