import { CALIBRATION_PEAK_DBFS } from '../engine';

export type AudioMetricsSnapshot = {
  dbfs: number;
  peakHz: number | null;
  peakLevel: number | null;
};

export function calibrateDbfsForDisplay(dbfs: number) {
  return dbfs + CALIBRATION_PEAK_DBFS;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDecibel(value: number, minDecibels: number, maxDecibels: number) {
  if (maxDecibels <= minDecibels) return 0;
  return clamp((value - minDecibels) / (maxDecibels - minDecibels), 0, 1);
}

export function analyzePeakFrequency(
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number,
  minDecibels: number,
  maxDecibels: number,
  minHz: number,
  maxHz: number
): { peakHz: number | null; peakLevel: number | null } {
  const normalizedFreqData = Float32Array.from(freqData, value => normalizeDecibel(value, minDecibels, maxDecibels));

  const start = Math.max(1, Math.floor((minHz * fftSize) / sampleRate));
  const end = Math.min(normalizedFreqData.length - 2, Math.floor((maxHz * fftSize) / sampleRate));

  let bestScore = -1;
  let bestIndex = -1;

  for (let i = start; i <= end; i++) {
    const score = normalizedFreqData[i - 1] * 0.25 + normalizedFreqData[i] * 0.5 + normalizedFreqData[i + 1] * 0.25;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex < 0) {
    return { peakHz: null, peakLevel: null };
  }

  return {
    peakHz: (bestIndex * sampleRate) / fftSize,
    peakLevel: bestScore,
  };
}
