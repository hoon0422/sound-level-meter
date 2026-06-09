export type StatsSnapshot = {
  averageDbfs: number;
  minimumDbfs: number;
  maximumDbfs: number;
  validFrameCount: number;
};

export type StatsSnapshotListener = (snapshot: StatsSnapshot) => void;

export type StatsDisposeListener = (snapshot: StatsSnapshot) => void;
