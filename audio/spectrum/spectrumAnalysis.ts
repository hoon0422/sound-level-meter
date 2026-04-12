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

function normalizeDecibel(
  value: number,
  minDecibels: number,
  maxDecibels: number,
) {
  if (maxDecibels <= minDecibels) return 0;
  return clamp((value - minDecibels) / (maxDecibels - minDecibels), 0, 1);
}

function buildLogBars(
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number,
  barCount: number,
  minHz: number,
  maxHz: number,
) {
  const bars: number[] = [];
  const safeMinHz = Math.max(minHz, sampleRate / fftSize);
  const safeMaxHz = Math.max(maxHz, safeMinHz);

  for (let bar = 0; bar < barCount; bar++) {
    const startRatio = bar / barCount;
    const endRatio = (bar + 1) / barCount;

    const startHz = safeMinHz * Math.pow(safeMaxHz / safeMinHz, startRatio);
    const endHz = safeMinHz * Math.pow(safeMaxHz / safeMinHz, endRatio);

    const startBin = clamp(
      hzToBin(startHz, sampleRate, fftSize),
      0,
      freqData.length - 1,
    );
    const endBin = clamp(
      hzToBin(endHz, sampleRate, fftSize),
      0,
      freqData.length - 1,
    );

    let sum = 0;
    let count = 0;

    for (let i = startBin; i <= endBin; i++) {
      sum += freqData[i];
      count++;
    }

    bars.push(count > 0 ? sum / count : 0);
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
  const normalizedFreqData = Float32Array.from(freqData, value =>
    normalizeDecibel(value, config.minDecibels, config.maxDecibels),
  );
  const bars = smoothArray(
    prevBars,
    buildLogBars(
      normalizedFreqData,
      config.sampleRate,
      config.fftSize,
      config.barCount,
      config.minHz,
      config.maxHz,
    ),
    config.barSmoothingAlpha,
  );

  return {
    bars,
  };
}
