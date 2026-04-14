export type RematchStatusValue = "running" | "completed" | "failed";

export type RematchStatusPayload = {
  status: RematchStatusValue | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  /** Candidates processed so far (running) or final count (completed). */
  signalsConsidered: number | null;
  /** Total vector matches for the current run (running only; null when idle). */
  candidatesTotal: number | null;
  inserted: number | null;
  updated: number | null;
};

export type RematchStatusBadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function getRematchStatusLabel(
  status: RematchStatusPayload["status"]
): string {
  switch (status) {
    case "running":
      return "Running";
    case "failed":
      return "Failed";
    case "completed":
      return "Completed";
    default:
      return "Not run yet";
  }
}

export function getRematchStatusBadgeVariant(
  status: RematchStatusPayload["status"]
): RematchStatusBadgeVariant {
  switch (status) {
    case "running":
      return "default";
    case "failed":
      return "destructive";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

/** Localized date/time for dashboard display; returns an em dash when missing or invalid. */
export function formatRematchDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

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
    const c = p.signalsConsidered;
    const t = p.candidatesTotal;
    if (c != null && t != null && t > 0) {
      return `Scan in progress: ${c} / ${t} candidates reviewed${p.inserted != null || p.updated != null ? ` · ${p.inserted ?? 0} new, ${p.updated ?? 0} updated` : ""}.`;
    }
    if (c != null && c > 0) {
      return `Scan in progress: ${c} candidate${c === 1 ? "" : "s"} reviewed so far.`;
    }
    return "Scan in progress…";
  }
  return "";
}
