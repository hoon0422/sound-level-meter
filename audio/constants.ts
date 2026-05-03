import { AudioEngineConfig, DEFAULT_AUDIO_ENGINE_CONFIG } from './engine';
import { AudioMetricsDisplayConfig, DEFAULT_AUDIO_METRICS_DISPLAY_CONFIG } from './metrics';
import { DEFAULT_SPECTRUM_DISPLAY_CONFIG, SpectrumDisplayConfig } from './spectrum';

export { DEFAULT_AUDIO_ENGINE_CONFIG, DEFAULT_AUDIO_METRICS_DISPLAY_CONFIG, DEFAULT_SPECTRUM_DISPLAY_CONFIG };

export type AudioMeterConfig = AudioEngineConfig & AudioMetricsDisplayConfig & SpectrumDisplayConfig;

export const DEFAULT_CONFIG: AudioMeterConfig = {
  ...DEFAULT_AUDIO_ENGINE_CONFIG,
  ...DEFAULT_AUDIO_METRICS_DISPLAY_CONFIG,
  ...DEFAULT_SPECTRUM_DISPLAY_CONFIG,
};
