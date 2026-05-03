import { MicrophoneController } from '@/audio/MicrophoneController';
import { StatsController, type StatsSnapshot, createIdleStatsSnapshot } from '@/audio/stats';
import type { StateCreator } from 'zustand';

export type StatsSlice = StatsSnapshot & {
  resetStats: () => void;
  // disposeStats: () => void;
};

export const createStatsSlice: StateCreator<StatsSlice> = set => {
  const mic = MicrophoneController.getInstance();
  const stats = new StatsController(mic);

  stats.subscribe(
    snapshot => set(snapshot),
    snapshot => set(snapshot)
  );

  return {
    ...createIdleStatsSnapshot(),
    resetStats: () => stats.reset(),
    // disposeStats: () => stats.dispose(),
  };
};
