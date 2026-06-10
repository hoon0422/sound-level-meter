import type { AudioMeterConfig } from '@/audio/constants';
import type { DbTimeGraphSample } from '@/audio/dbTimeGraph';
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

export type AudioMeterState = MicrophoneSlice & SpectrumSlice & AudioMetricsSlice & StatsSlice & DbTimeGraphSlice;

export type DbTimeGraphSlice = {
  dbTimeGraphSamples: readonly DbTimeGraphSample[];
  dbTimeGraphIsRunning: boolean;
  dbTimeGraphWindowStartSeconds: number;
  dbTimeGraphWindowEndSeconds: number;
  dbTimeGraphVersion: number;
};

export type MicrophoneSlice = MicrophoneState & {
  connect: (config: AudioEngineConfig) => Promise<boolean>;
  start: (config: AudioEngineConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};
