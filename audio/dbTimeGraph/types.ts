export type DbTimeGraphSample = {
  db: number;
  sessionElapsedSeconds: number;
  isInitial?: boolean;
};

export type DbTimeGraphSnapshot = {
  samples: DbTimeGraphSample[];
  isRunning: boolean;
  windowStartSeconds: number;
  windowEndSeconds: number;
  version: number;
};

export type DbTimeGraphConfig = {
  windowDurationMs: number;
  sampleIntervalMs: number;
};
