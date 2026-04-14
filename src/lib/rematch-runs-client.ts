import type { ProfileRematchRun } from "@/types/database";

export type RematchRunListRow = Pick<
  ProfileRematchRun,
  | "id"
  | "status"
  | "error_message"
  | "signals_considered"
  | "inserted"
  | "updated"
  | "started_at"
  | "finished_at"
>;

export async function fetchRematchRuns(): Promise<RematchRunListRow[]> {
  const res = await fetch("/api/profiles/rematch-runs", { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as {
    runs?: RematchRunListRow[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not load scan history.");
  }
  return data.runs ?? [];
}

export async function cancelRematchRun(runId: string): Promise<void> {
  const res = await fetch(`/api/profiles/rematch-runs/${runId}/cancel`, {
    method: "POST",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not cancel this scan.");
  }
}
