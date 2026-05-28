import type { AudioMeterConfig } from '@/audio/constants';
import { type AudioMetricsDisplayConfig, type AudioMetricsSnapshot } from '@/audio/metrics';
import { type AudioEngineConfig, type MicrophoneState } from '@/audio/MicrophoneController';
import { type SpectrumDisplayConfig, type SpectrumSnapshot } from '@/audio/spectrum';
import { type StatsSnapshot } from '@/audio/stats';

export type StatsSlice = StatsSnapshot & {
  resetStats: () => void;
};

export type SpectrumSlice = SpectrumSnapshot & {
  configureSpectrum: (config: SpectrumDisplayConfig) => void;
  // disposeSpectrum: () => void;
};

export type AudioMetricsSlice = AudioMetricsSnapshot & {
  configureAudioMetrics: (config: AudioMetricsDisplayConfig) => void;
};

export type { AudioEngineConfig, AudioMeterConfig, AudioMetricsDisplayConfig, SpectrumDisplayConfig };

export type AudioMeterState = MicrophoneSlice & SpectrumSlice & AudioMetricsSlice & StatsSlice & AudioSamplesSlice;

export type Sample = { db: number; timestamp: number };

export type AudioSamplesSlice = {
  samples: Sample[];
  addSample: (sample: Sample) => void;
  clearSamples: () => void;
};

export type MicrophoneSlice = MicrophoneState & {
  connect: (config: AudioEngineConfig) => Promise<boolean>;
  start: (config: AudioEngineConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};
