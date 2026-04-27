import { AudioEngineConfig } from "./types";

export const DEFAULT_AUDIO_ENGINE_CONFIG: AudioEngineConfig = {
  sampleRate: 48000,
  fftSize: 1024,
  smoothingTimeConstant: 0.3,
  minDecibels: -90,
  maxDecibels: -10,
  autoResumeContext: true,
};

export const CALIBRATION_PEAK_DBFS = 100;
