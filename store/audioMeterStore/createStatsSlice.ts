import { MicrophoneController } from '@/audio/MicrophoneController';
import { StatsController, createIdleStatsSnapshot } from '@/audio/stats';
import type { StateCreator } from 'zustand';
import type { AudioMeterState, StatsSlice } from './types';

export const createStatsSlice: StateCreator<AudioMeterState, [['zustand/devtools', never]], [], StatsSlice> = set => {
  const mic = MicrophoneController.getInstance();
  const stats = new StatsController(mic);

  stats.subscribe(
    snapshot => set(snapshot, false, 'updateStats'),
    snapshot => set(snapshot, false, 'disposeStats')
  );

  return {
    ...createIdleStatsSnapshot(),
    resetStats: () => stats.reset(),
  };
};
