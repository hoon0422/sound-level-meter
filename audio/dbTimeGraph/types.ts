export type DbTimeGraphSample = {
  db: number;
  sessionElapsedSeconds: number;
  isInitial?: boolean;
};

export type DbTimeGraphPoint = {
  x: number;
  y: number;
};

export type DbTimeGraphArtifact = {
  path: string;
  currentPoint: DbTimeGraphPoint | null;
};

export type DbTimeGraphSnapshot = DbTimeGraphArtifact & {
  isRunning: boolean;
  windowStartSeconds: number;
  windowEndSeconds: number;
  version: number;
};

export type DbTimeGraphConfig = {
  windowDurationMs: number;
  sampleIntervalMs: number;
};
