export type StatsSnapshot = {
  averageDbfs: number;
  maximumDbfs: number;
  maximumDbfsPerFrequencyBin: number[];
};

export type StatsSnapshotListener = (snapshot: StatsSnapshot) => void;

export type StatsDisposeListener = (snapshot: StatsSnapshot) => void;
