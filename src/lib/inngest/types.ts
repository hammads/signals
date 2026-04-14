export type Events = {
  "signal/batch.collected": {
    data: { signalIds: string[] };
  };
  "signal/districts.enriched": {
    data: { signalIds: string[] };
  };
  "signal/embeddings.ready": {
    data: { signalIds: string[] };
  };
  "profile/re-match.requested": {
    data: { userId: string; runId: string };
  };
};
