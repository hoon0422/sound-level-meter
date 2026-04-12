import { SPECTRUM_BANDS } from "./constants";
import { SpectrumBand } from "./types";

type SpectrumAnalysisConfig = {
  sampleRate: number;
  fftSize: number;
  barCount: number;
  minHz: number;
  maxHz: number;
  minDecibels: number;
  maxDecibels: number;
  noiseFloorDbfs: number;
  barSmoothingAlpha: number;
};

export type SpectrumFrameAnalysis = {
  bars: number[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hzToBin(hz: number, sampleRate: number, fftSize: number) {
  return Math.floor((hz * fftSize) / sampleRate);
}

function buildBandBars(
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number,
  bands: SpectrumBand[],
  minDecibels: number,
) {
  const bars: number[] = [];

  for (const band of bands) {
    const startBin = clamp(
      hzToBin(band.lowEdge, sampleRate, fftSize),
      0,
      freqData.length - 1,
    );
    const endBin = clamp(
      hzToBin(band.highEdge, sampleRate, fftSize),
      0,
      freqData.length - 1,
    );

    let sum = 0;
    let count = 0;

    for (let i = startBin; i <= endBin; i++) {
      sum += freqData[i];
      count++;
    }

    bars.push(count > 0 ? sum / count : minDecibels);
  }

  return bars;
}

function smoothArray(prev: number[], next: number[], alpha: number) {
  if (prev.length === 0) return next;
  return next.map((value, i) => {
    const oldValue = prev[i] ?? value;
    return oldValue * (1 - alpha) + value * alpha;
  });
}

export function analyzeFrequencyFrame(
  freqData: Float32Array,
  prevBars: number[],
  config: Omit<SpectrumAnalysisConfig, "noiseFloorDbfs">,
): SpectrumFrameAnalysis {
  const bars = smoothArray(
    prevBars,
    buildBandBars(
      freqData,
      config.sampleRate,
      config.fftSize,
      SPECTRUM_BANDS,
      config.minDecibels,
    ),
    config.barSmoothingAlpha,
  );

  return {
    bars,
  };
}
