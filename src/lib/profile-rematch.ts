import type { RematchStatusPayload } from "@/lib/rematch-status";

/**
 * Triggers a background re-match of existing signals against the current profile embedding.
 */
export async function requestProfileRematch(): Promise<
  { ok: true; message: string } | { ok: false; error: string }
> {
  const res = await fetch("/api/profiles/re-match", { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    return { ok: false, error: data.error ?? "Failed to start scan" };
  }

  return { ok: true, message: data.message ?? "Scan queued" };
}

export async function fetchRematchStatus(): Promise<RematchStatusPayload> {
  const res = await fetch("/api/profiles/rematch-status");
  const data = (await res.json().catch(() => ({}))) as RematchStatusPayload & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load scan status");
  }

  return {
    status: data.status,
    startedAt: data.startedAt,
    finishedAt: data.finishedAt,
    error: data.error,
    signalsConsidered: data.signalsConsidered,
    candidatesTotal: data.candidatesTotal ?? null,
    inserted: data.inserted,
    updated: data.updated,
  };
}

/**
 * Polls until the rematch job finishes or max attempts. The first request runs immediately.
 */
export async function pollRematchUntilTerminal(options?: {
  intervalMs?: number;
  maxAttempts?: number;
  onTick?: (p: RematchStatusPayload) => void;
}): Promise<RematchStatusPayload> {
  const intervalMs = options?.intervalMs ?? 2000;
  const maxAttempts = options?.maxAttempts ?? 45;
  let last: RematchStatusPayload | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    last = await fetchRematchStatus();
    options?.onTick?.(last);
    if (last.status === "completed" || last.status === "failed") {
      return last;
    }
    if (last.status !== "running") {
      return last;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return last ?? fetchRematchStatus();
}

export function toastRematchOutcome(
  final: RematchStatusPayload,
  toastApi: typeof import("sonner").toast
) {
  if (final.status === "completed") {
    const i = final.inserted ?? 0;
    const u = final.updated ?? 0;
    if (i + u > 0) {
      toastApi.success(`Scan complete: ${i} new, ${u} updated.`);
    } else {
      toastApi.success(
        "Scan complete. No new matches met your relevance threshold this time."
      );
    }
    return;
  }
  if (final.status === "failed") {
    toastApi.error(final.error ?? "Scan failed");
    return;
  }
  if (final.status === "running") {
    toastApi.message(
      "Scan is still running — refresh this page in a moment for results."
    );
  }
}
