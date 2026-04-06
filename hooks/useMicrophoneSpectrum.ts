// useMicrophoneSpectrum.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnalyserNode,
  AudioContext,
  AudioManager,
  AudioNode,
  AudioRecorder,
} from "react-native-audio-api";

export type MicrophoneSpectrumSnapshot = {
  isRunning: boolean;
  dbfs: number;
  peakHz: number | null;
  peakLevel: number | null;
  bars: number[];
  bass: number;
  mid: number;
  treble: number;
  error: string | null;
};

export type UseMicrophoneSpectrumOptions = {
  fftSize?: number;
  barCount?: number;
  uiFps?: number;
  minHz?: number;
  maxHz?: number;
  minDecibels?: number;
  maxDecibels?: number;
  smoothingTimeConstant?: number;
  noiseFloorDbfs?: number;
  barSmoothingAlpha?: number;
  sampleRate?: number;
  autoResumeContext?: boolean;
};

const DEFAULTS: Required<UseMicrophoneSpectrumOptions> = {
  fftSize: 2048,
  barCount: 32,
  uiFps: 20,
  minHz: 80,
  maxHz: 8000,
  minDecibels: -90,
  maxDecibels: -10,
  smoothingTimeConstant: 0.8,
  noiseFloorDbfs: -65,
  barSmoothingAlpha: 0.2,
  sampleRate: 44100,
  autoResumeContext: true,
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

export function useMicrophoneSpectrum(options?: UseMicrophoneSpectrumOptions) {
  const opts = { ...DEFAULTS, ...options };

  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const adapterRef = useRef<AudioNode | null>(null);

  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);
  const smoothedBarsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastUiUpdateRef = useRef(0);

  const [snapshot, setSnapshot] = useState<MicrophoneSpectrumSnapshot>({
    isRunning: false,
    dbfs: -100,
    peakHz: null,
    peakLevel: null,
    bars: Array(opts.barCount).fill(0),
    bass: 0,
    mid: 0,
    treble: 0,
    error: null,
  });

  const cleanupGraphOnly = useCallback(() => {
    try {
      recorderRef.current?.disconnect();
    } catch {}

    try {
      adapterRef.current?.disconnect();
    } catch {}

    try {
      analyserRef.current?.disconnect();
    } catch {}

    adapterRef.current = null;
    analyserRef.current = null;
    freqDataRef.current = null;
    timeDataRef.current = null;
    smoothedBarsRef.current = [];
  }, []);

  const stop = useCallback(async () => {
    runningRef.current = false;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    try {
      recorderRef.current?.stop();
    } catch {}

    cleanupGraphOnly();

    try {
      await audioContextRef.current?.suspend();
    } catch {}

    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {}

    try {
      await audioContextRef.current?.close();
    } catch {}

    audioContextRef.current = null;
    recorderRef.current = null;

    setSnapshot(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, [cleanupGraphOnly]);

  const tick = useCallback(() => {
    if (!runningRef.current) return;

    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    const freqData = freqDataRef.current;
    const timeData = timeDataRef.current;

    if (!ctx || !analyser || !freqData || !timeData) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    analyser.getByteFrequencyData(freqData);
    analyser.getFloatTimeDomainData(timeData);

    const dbfs = dbfsFromTimeDomainFloat(timeData, -100);

    const rawBars = buildLogBars(
      freqData,
      ctx.sampleRate,
      analyser.fftSize,
      opts.barCount,
      opts.minHz,
      opts.maxHz,
    );

    const bars = smoothArray(
      smoothedBarsRef.current,
      rawBars,
      opts.barSmoothingAlpha,
    );
    smoothedBarsRef.current = bars;

    const bass = averageFrequencyRange(
      freqData,
      ctx.sampleRate,
      analyser.fftSize,
      20,
      250,
    );
    const mid = averageFrequencyRange(
      freqData,
      ctx.sampleRate,
      analyser.fftSize,
      250,
      2000,
    );
    const treble = averageFrequencyRange(
      freqData,
      ctx.sampleRate,
      analyser.fftSize,
      2000,
      8000,
    );

    const hasMeaningfulSignal = dbfs > opts.noiseFloorDbfs;

    const { peakHz, peakLevel } = hasMeaningfulSignal
      ? getPeakFrequencySmoothed(
          freqData,
          ctx.sampleRate,
          analyser.fftSize,
          opts.minHz,
          opts.maxHz,
        )
      : { peakHz: null, peakLevel: null };

    const now = Date.now();
    const uiInterval = 1000 / opts.uiFps;

    if (now - lastUiUpdateRef.current >= uiInterval) {
      lastUiUpdateRef.current = now;

      setSnapshot({
        isRunning: true,
        dbfs,
        peakHz,
        peakLevel,
        bars,
        bass,
        mid,
        treble,
        error: null,
      });
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [
    opts.barCount,
    opts.barSmoothingAlpha,
    opts.maxHz,
    opts.minHz,
    opts.noiseFloorDbfs,
    opts.uiFps,
  ]);

  const start = useCallback(async () => {
    await stop();

    try {
      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== "Granted") {
        setSnapshot(prev => ({
          ...prev,
          isRunning: false,
          error: "Microphone permission was not granted.",
        }));
        return false;
      }

      const sessionActivated = await AudioManager.setAudioSessionActivity(true);
      if (!sessionActivated) {
        setSnapshot(prev => ({
          ...prev,
          isRunning: false,
          error: "Could not activate audio session.",
        }));
        return false;
      }

      const audioContext = new AudioContext({ sampleRate: opts.sampleRate });
      const recorder = new AudioRecorder();
      const analyser = audioContext.createAnalyser();
      const adapter = audioContext.createRecorderAdapter();

      analyser.fftSize = opts.fftSize;
      analyser.smoothingTimeConstant = opts.smoothingTimeConstant;
      analyser.minDecibels = opts.minDecibels;
      analyser.maxDecibels = opts.maxDecibels;

      recorder.connect(adapter);
      adapter.connect(analyser);
      analyser.connect(audioContext.destination);

      if (opts.autoResumeContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const startResult = recorder.start();
      if (startResult.status === "error") {
        throw new Error(startResult.message);
      }

      audioContextRef.current = audioContext;
      recorderRef.current = recorder;
      analyserRef.current = analyser;
      adapterRef.current = adapter;

      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDataRef.current = new Float32Array(analyser.fftSize);
      smoothedBarsRef.current = [];
      lastUiUpdateRef.current = 0;
      runningRef.current = true;

      setSnapshot({
        isRunning: true,
        dbfs: -100,
        peakHz: null,
        peakLevel: null,
        bars: Array(opts.barCount).fill(0),
        bass: 0,
        mid: 0,
        treble: 0,
        error: null,
      });

      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown microphone error";

      await stop();

      setSnapshot(prev => ({
        ...prev,
        isRunning: false,
        error: message,
      }));

      return false;
    }
  }, [
    opts.autoResumeContext,
    opts.barCount,
    opts.fftSize,
    opts.maxDecibels,
    opts.minDecibels,
    opts.sampleRate,
    opts.smoothingTimeConstant,
    stop,
    tick,
  ]);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return useMemo(
    () => ({
      start,
      stop,
      ...snapshot,
    }),
    [snapshot, start, stop],
  );
}
