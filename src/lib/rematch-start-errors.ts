import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Maps Supabase/Postgres errors from the re-match POST flow into short,
 * user-visible strings (no raw SQL). Used for API responses and profile_rematch_runs.error_message.
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
    return "Scan could not be recorded: your account profile may be missing or out of sync. Try signing out and back in, or contact support.";
  }

  if (
    code === "42501" ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    details.includes("row-level security")
  ) {
    return "Scan could not be saved (permission denied). Try signing out and back in.";
  }

  if (code === "42703" || msg.includes("does not exist")) {
    return "Scan status could not be updated (database schema mismatch). Contact support.";
  }

  if (code === "PGRST116") {
    return "Signal profile was not found. Complete onboarding or save your profile again.";
  }

  if (code === "PGRST301" || msg.includes("jwt") || msg.includes("expired")) {
    return "Your session may have expired. Refresh the page or sign in again.";
  }

  if (code === "23514" || msg.includes("violates check constraint")) {
    return "Scan could not be saved (invalid data). Contact support.";
  }

  const suffix = code ? ` Error code: ${code}.` : "";
  return phase === "insert_run"
    ? `Could not record this scan.${suffix}`
    : `Could not update scan status.${suffix}`;
}
