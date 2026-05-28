import { MicrophoneController } from '@/audio/MicrophoneController';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { AudioMetricsController, createIdleAudioMetricsSnapshot } from '@/audio/metrics';
import type { StateCreator } from 'zustand';
import type { AudioMeterState, AudioMetricsDisplayConfig, AudioMetricsSlice } from './types';

export const createAudioMetricsSlice: StateCreator<
  AudioMeterState,
  [['zustand/devtools', never]],
  [],
  AudioMetricsSlice
> = set => {
  const mic = MicrophoneController.getInstance();
  const metrics = new AudioMetricsController(mic, DEFAULT_CONFIG);

  metrics.subscribe(snapshot => set(snapshot, false, 'updateAudioMetrics'));

  return {
    ...createIdleAudioMetricsSnapshot(),
    configureAudioMetrics: (config: AudioMetricsDisplayConfig) => metrics.configure(config),
    // disposeAudioMetrics: () => metrics.dispose(),
  };
};
