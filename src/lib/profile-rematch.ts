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

  return { ok: true, message: data.message ?? "Scan started" };
}
