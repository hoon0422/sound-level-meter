import { AudioEngineConfig } from "./types";

export const DEFAULT_AUDIO_ENGINE_CONFIG: AudioEngineConfig = {
<<<<<<< HEAD
  sampleRate: 48000,
=======
  sampleRate: 44100,
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
  fftSize: 1024,
  smoothingTimeConstant: 0.3,
  minDecibels: -90,
  maxDecibels: -10,
  autoResumeContext: true,
};
<<<<<<< HEAD

export const CALIBRATION_PEAK_DBFS = 100;
=======
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
