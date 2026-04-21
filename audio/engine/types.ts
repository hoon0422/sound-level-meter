export type AudioEngineConfig = {
  sampleRate: number;
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  autoResumeContext: boolean;
};
