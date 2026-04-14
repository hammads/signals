import type { ProfileRematchRun } from "@/types/database";

export type ScanHistoryOutcomeRow = Pick<
  ProfileRematchRun,
  "status" | "signals_considered" | "candidates_total" | "inserted" | "updated"
>;

/** Human-readable interpretation for the Notes column (not errors). */
export function getScanOutcomeHint(run: ScanHistoryOutcomeRow): string {
  if (run.status === "running") {
    const p = run.signals_considered;
    const t = run.candidates_total;
    if (p != null && t != null && t > 0) {
      return `Reviewing candidates (${p} / ${t}). Scoring relevance with AI for each.`;
    }
    if (p != null && p > 0) {
      return `${p} candidate${p === 1 ? "" : "s"} reviewed…`;
    }
    return "In progress…";
  }
  if (run.status === "failed") {
    return "—";
  }
  if (run.status !== "completed") {
    return "—";
  }

  const c = run.signals_considered ?? 0;
  const ins = run.inserted ?? 0;
  const up = run.updated ?? 0;

  if (c === 0) {
    return "No vector matches above the similarity threshold — widen your profile or wait for new signals.";
  }
  if (ins === 0 && up === 0) {
    return "Candidates were reviewed but none met the AI relevance bar for your feed.";
  }
  if (ins > 0 || up > 0) {
    return "Matches written to your feed.";
  }
  return "—";
}
