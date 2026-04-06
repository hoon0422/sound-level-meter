type SpectrumAnalysisConfig = {
  sampleRate: number;
  fftSize: number;
  barCount: number;
  minHz: number;
  maxHz: number;
  noiseFloorDbfs: number;
  barSmoothingAlpha: number;
};

export type SpectrumFrameAnalysis = {
  dbfs: number;
  peakHz: number | null;
  peakLevel: number | null;
  bars: number[];
  bass: number;
  mid: number;
  treble: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hzToBin(hz: number, sampleRate: number, fftSize: number) {
  return Math.floor((hz * fftSize) / sampleRate);
}

function dbfsFromTimeDomainFloat(data: Float32Array, floor = -100) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const x = data[i];
    sum += x * x;
  }

  const rms = Math.sqrt(sum / data.length);
  if (rms <= 1e-8) return floor;
  return Math.max(20 * Math.log10(rms), floor);
}

function averageFrequencyRange(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number,
) {
  const start = clamp(
    hzToBin(minHz, sampleRate, fftSize),
    0,
    freqData.length - 1,
  );
  const end = clamp(
    hzToBin(maxHz, sampleRate, fftSize),
    0,
    freqData.length - 1,
  );

  if (end < start) return 0;

  let sum = 0;
  let count = 0;

  for (let i = start; i <= end; i++) {
    sum += freqData[i];
    count++;
  }

  return count > 0 ? sum / count / 255 : 0;
}

function getPeakFrequencySmoothed(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number,
) {
  const start = Math.max(1, Math.floor((minHz * fftSize) / sampleRate));
  const end = Math.min(
    freqData.length - 2,
    Math.floor((maxHz * fftSize) / sampleRate),
  );

  let bestScore = -1;
  let bestIndex = -1;

  for (let i = start; i <= end; i++) {
    const score =
      freqData[i - 1] * 0.25 + freqData[i] * 0.5 + freqData[i + 1] * 0.25;

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
    peakLevel: bestScore / 255,
  };
}

function buildLogBars(
  freqData: Uint8Array,
  sampleRate: number,
  fftSize: number,
  barCount: number,
  minHz: number,
  maxHz: number,
) {
  const bars: number[] = [];

  for (let bar = 0; bar < barCount; bar++) {
    const startRatio = bar / barCount;
    const endRatio = (bar + 1) / barCount;

    const startHz = minHz * Math.pow(maxHz / minHz, startRatio);
    const endHz = minHz * Math.pow(maxHz / minHz, endRatio);

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

    bars.push(count > 0 ? sum / count / 255 : 0);
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

export function analyzeSpectrumFrame(
  freqData: Uint8Array,
  timeData: Float32Array,
  prevBars: number[],
  config: SpectrumAnalysisConfig,
): SpectrumFrameAnalysis {
  const dbfs = dbfsFromTimeDomainFloat(timeData, -100);
  const bars = smoothArray(
    prevBars,
    buildLogBars(
      freqData,
      config.sampleRate,
      config.fftSize,
      config.barCount,
      config.minHz,
      config.maxHz,
    ),
    config.barSmoothingAlpha,
  );

  const bass = averageFrequencyRange(
    freqData,
    config.sampleRate,
    config.fftSize,
    20,
    250,
  );
  const mid = averageFrequencyRange(
    freqData,
    config.sampleRate,
    config.fftSize,
    250,
    2000,
  );
  const treble = averageFrequencyRange(
    freqData,
    config.sampleRate,
    config.fftSize,
    2000,
    8000,
  );

  const hasMeaningfulSignal = dbfs > config.noiseFloorDbfs;
  const { peakHz, peakLevel } = hasMeaningfulSignal
    ? getPeakFrequencySmoothed(
        freqData,
        config.sampleRate,
        config.fftSize,
        config.minHz,
        config.maxHz,
      )
    : { peakHz: null, peakLevel: null };

  return {
    dbfs,
    peakHz,
    peakLevel,
    bars,
    bass,
    mid,
    treble,
  };
}
