import { AudioEngineConfig, DEFAULT_AUDIO_ENGINE_CONFIG } from "./engine";
import {
<<<<<<< HEAD
  AudioMetricsDisplayConfig,
  DEFAULT_AUDIO_METRICS_DISPLAY_CONFIG,
} from "./metrics";
import {
=======
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
  DEFAULT_SPECTRUM_DISPLAY_CONFIG,
  SpectrumDisplayConfig,
} from "./spectrum";

<<<<<<< HEAD
export {
  DEFAULT_AUDIO_ENGINE_CONFIG,
  DEFAULT_AUDIO_METRICS_DISPLAY_CONFIG,
  DEFAULT_SPECTRUM_DISPLAY_CONFIG,
};

export type MicrophoneSpectrumConfig = AudioEngineConfig &
  AudioMetricsDisplayConfig &
=======
export { DEFAULT_AUDIO_ENGINE_CONFIG, DEFAULT_SPECTRUM_DISPLAY_CONFIG };

export type MicrophoneSpectrumConfig = AudioEngineConfig &
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
  SpectrumDisplayConfig;

export const DEFAULT_CONFIG: MicrophoneSpectrumConfig = {
  ...DEFAULT_AUDIO_ENGINE_CONFIG,
<<<<<<< HEAD
  ...DEFAULT_AUDIO_METRICS_DISPLAY_CONFIG,
=======
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
  ...DEFAULT_SPECTRUM_DISPLAY_CONFIG,
};
