export type Events = {
  "signal/batch.collected": {
    data: { signalIds: string[] };
  };
  "signal/embeddings.ready": {
    data: { signalIds: string[] };
  };
};
