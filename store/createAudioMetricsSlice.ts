import { MicrophoneController } from '@/audio/MicrophoneController';
import { DEFAULT_CONFIG } from '@/audio/constants';
import {
  AudioMetricsController,
  type AudioMetricsDisplayConfig,
  type AudioMetricsSnapshot,
  createIdleAudioMetricsSnapshot,
} from '@/audio/metrics';
import type { StateCreator } from 'zustand';

export type { AudioMetricsDisplayConfig };

export type AudioMetricsSlice = AudioMetricsSnapshot & {
  configureAudioMetrics: (config: AudioMetricsDisplayConfig) => void;
  // disposeAudioMetrics: () => void;
};

export const createAudioMetricsSlice: StateCreator<AudioMetricsSlice> = set => {
  const mic = MicrophoneController.getInstance();
  const metrics = new AudioMetricsController(mic, DEFAULT_CONFIG);

  metrics.subscribe(snapshot => set(snapshot));

  return {
    ...createIdleAudioMetricsSnapshot(),
    configureAudioMetrics: (config: AudioMetricsDisplayConfig) => metrics.configure(config),
    // disposeAudioMetrics: () => metrics.dispose(),
  };
};
