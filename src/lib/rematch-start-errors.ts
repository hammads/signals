import type { PostgrestError } from "@supabase/supabase-js";

const MAX_SUPPLEMENT_LEN = 320;

function clipOneLine(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Extra context from PostgREST/Postgres (column names, hints) without echoing huge payloads. */
function supplementalServerText(err: PostgrestError, base: string): string {
  const detail = err.details?.trim();
  const hint = err.hint?.trim();
  const message = err.message?.trim();
  const prefer = detail || hint || "";
  const fallbackMsg =
    message &&
    message.length > 0 &&
    !base.toLowerCase().includes(message.slice(0, Math.min(48, message.length)).toLowerCase())
      ? message
      : "";
  const chunk = prefer || fallbackMsg;
  return chunk ? clipOneLine(chunk, MAX_SUPPLEMENT_LEN) : "";
}

function joinBaseCodeAndSupplement(
  base: string,
  err: PostgrestError,
  includeCode: boolean
): string {
  const sup = supplementalServerText(err, base);
  const parts = [base];
  if (sup) {
    parts.push(sup);
  }
  if (includeCode && err.code) {
    parts.push(`Code: ${err.code}.`);
  }
  return parts.join(" ");
}

/**
 * Maps Supabase/Postgres errors from the re-match POST flow into user-visible strings.
 * Adds server `details` / `hint` / `message` when they add information beyond the summary.
 */
export function userFacingRematchStartError(
  err: PostgrestError | null | undefined,
  phase: "insert_run" | "update_profile"
): string {
  if (!err) {
    return phase === "insert_run"
      ? "Could not record this scan."
      : "Could not update your scan status on the server.";
  }

  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  const details = (err.details ?? "").toLowerCase();

  if (
    code === "23503" ||
    msg.includes("foreign key") ||
    details.includes("foreign key")
  ) {
    return joinBaseCodeAndSupplement(
      "Scan could not be recorded: your account profile may be missing or out of sync. Try signing out and back in, or contact support.",
      err,
      true
    );
  }

  if (
    code === "42501" ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    details.includes("row-level security")
  ) {
    return joinBaseCodeAndSupplement(
      "Scan could not be saved (permission denied). Try signing out and back in.",
      err,
      true
    );
  }

  if (code === "42703" || msg.includes("does not exist")) {
    return joinBaseCodeAndSupplement(
      "Scan status could not be updated: a referenced database column is missing. Apply pending migrations.",
      err,
      true
    );
  }

  if (code === "PGRST116") {
    return joinBaseCodeAndSupplement(
      "Signal profile was not found. Complete onboarding or save your profile again.",
      err,
      true
    );
  }

  if (code === "PGRST204") {
    return joinBaseCodeAndSupplement(
      "The API does not recognize one or more rematch columns on signal_profiles. Apply migration 00008 (or 00010 ensure), then reload the PostgREST schema in Supabase if the columns already exist in SQL.",
      err,
      true
    );
  }

  if (code === "PGRST205") {
    return joinBaseCodeAndSupplement(
      "The signal_profiles table was not found by the API. Apply migrations and confirm the table is in the exposed schema.",
      err,
      true
    );
  }

  if (code === "PGRST301" || msg.includes("jwt") || msg.includes("expired")) {
    return joinBaseCodeAndSupplement(
      "Your session may have expired. Refresh the page or sign in again.",
      err,
      true
    );
  }

  if (code === "23514" || msg.includes("violates check constraint")) {
    return joinBaseCodeAndSupplement(
      "Scan could not be saved: data did not pass a database check constraint.",
      err,
      true
    );
  }

  const phaseDefault =
    phase === "insert_run"
      ? "Could not record this scan."
      : "Could not update scan status.";
  return joinBaseCodeAndSupplement(phaseDefault, err, true);
}
