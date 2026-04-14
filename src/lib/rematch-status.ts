export type RematchStatusValue = "running" | "completed" | "failed";

export type RematchStatusPayload = {
  status: RematchStatusValue | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  signalsConsidered: number | null;
  inserted: number | null;
  updated: number | null;
};

export function formatRematchSummary(p: RematchStatusPayload): string {
  if (p.status === "failed") {
    return p.error ? `Last scan failed: ${p.error}` : "Last scan failed.";
  }
  if (p.status === "completed" && p.finishedAt) {
    const parts: string[] = ["Scan finished"];
    if (p.inserted != null || p.updated != null) {
      const i = p.inserted ?? 0;
      const u = p.updated ?? 0;
      parts.push(`${i} new, ${u} updated`);
    }
    if (p.signalsConsidered != null) {
      parts.push(`${p.signalsConsidered} candidates checked`);
    }
    return parts.join(" · ");
  }
  if (p.status === "running") {
    return "Scan in progress…";
  }
  return "";
}
