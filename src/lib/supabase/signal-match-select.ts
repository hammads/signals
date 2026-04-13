/**
 * PostgREST can embed `signal_districts → signals` (FK on signal_id) and
 * `signal_districts → lea_directory` (FK on lea_id). It cannot embed through
 * `signal_districts_expanded` because views do not expose FK metadata.
 */
const SIGNAL_DISTRICTS_EMBED =
  "signal_districts:signal_districts!signal_id(id, lea_id, extracted_text, match_score, lea_directory(name, state))";

export function signalMatchesSelect(hasSignalFilter: boolean): string {
  const signalJoin = hasSignalFilter ? "signals!inner" : "signals";
  return `*, signal:${signalJoin}(*, ${SIGNAL_DISTRICTS_EMBED})`;
}
