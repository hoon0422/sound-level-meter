import { MicrophoneSpectrumConfig } from "./MicrophoneSpectrumController";

export const DEFAULT_CONFIG: MicrophoneSpectrumConfig = {
  fftSize: 1024,
  barCount: 32,
  minHz: 0,
  maxHz: 20000,
  noiseFloorDbfs: -65,
  barSmoothingAlpha: 0.2,
  sampleRate: 44100,
  smoothingTimeConstant: 0.3,
  minDecibels: -90,
  maxDecibels: -10,
  autoResumeContext: true,
};
