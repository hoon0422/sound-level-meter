export type AudioFrameQuality = {
  isValid: boolean;
  rawDbfs: number;
  rms: number;
  peakAbs: number;
  zeroRatio: number;
  frameDurationSeconds: number;
};

const MIN_VALID_DBFS = -99.5;
const MIN_VALID_RMS = 1e-8;
const MIN_VALID_PEAK_ABS = 1e-7;
const MAX_VALID_ZERO_RATIO = 0.98;

export function classifyAudioFrameQuality({
  rawDbfs,
  rms,
  peakAbs,
  zeroRatio,
  frameDurationSeconds,
}: Omit<AudioFrameQuality, 'isValid'>): AudioFrameQuality {
  const isValid =
    Number.isFinite(rawDbfs) &&
    rawDbfs > MIN_VALID_DBFS &&
    Number.isFinite(rms) &&
    rms > MIN_VALID_RMS &&
    Number.isFinite(peakAbs) &&
    peakAbs > MIN_VALID_PEAK_ABS &&
    Number.isFinite(zeroRatio) &&
    zeroRatio < MAX_VALID_ZERO_RATIO &&
    frameDurationSeconds > 0;

  return {
    isValid,
    rawDbfs,
    rms,
    peakAbs,
    zeroRatio,
    frameDurationSeconds,
  };
}
