import {
  AudioRuntimeMetrics,
  createMicrophoneSpectrumEngine,
  getMicrophoneSpectrumEngine,
  stopMicrophoneSpectrumEngine,
} from "@/audio/microphoneSpectrumEngine";
import {
  analyzeFrequencyFrame,
  calibrateDbfsForDisplay,
} from "@/audio/spectrumAnalysis";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AudioManager } from "react-native-audio-api";

export type MicrophoneSpectrumSnapshot = {
  isRunning: boolean;
  elapsedSeconds: number;
  dbfs: number;
  peakHz: number | null;
  peakLevel: number | null;
  bars: number[];
  error: string | null;
};

export type UseMicrophoneSpectrumOptions = {
  fftSize?: number;
  barCount?: number;
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

const DEFAULT_MICROPHONE_SPECTRUM_OPTIONS: Required<UseMicrophoneSpectrumOptions> =
  {
    fftSize: 2048,
    barCount: 32,
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

export function useMicrophoneSpectrum(options?: UseMicrophoneSpectrumOptions) {
  const opts = { ...DEFAULT_MICROPHONE_SPECTRUM_OPTIONS, ...options };

  const freqDataRef = useRef<Float32Array | null>(null);
  const smoothedBarsRef = useRef<number[]>([]);
  const runningRef = useRef(false);
  const latestElapsedSecondsRef = useRef(0);

  const [snapshot, setSnapshot] = useState<MicrophoneSpectrumSnapshot>(() =>
    createIdleMicrophoneSpectrumSnapshot(opts.barCount),
  );

  const stop = useCallback(async () => {
    runningRef.current = false;

    await stopMicrophoneSpectrumEngine();
    freqDataRef.current = null;
    smoothedBarsRef.current = [];
    latestElapsedSecondsRef.current = 0;

    setSnapshot(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const handleAudioMetrics = useCallback((metrics: AudioRuntimeMetrics) => {
    if (!runningRef.current) return;

    const engine = getMicrophoneSpectrumEngine();
    const freqData = freqDataRef.current;

    if (!engine || !freqData) {
      return;
    }

    latestElapsedSecondsRef.current += metrics.elapsedSeconds;
    engine.analyser.getFloatFrequencyData(freqData);

    const analysis = analyzeFrequencyFrame(
      freqData,
      smoothedBarsRef.current,
      {
        sampleRate: engine.audioContext.sampleRate,
        fftSize: engine.analyser.fftSize,
        barCount: opts.barCount,
        minHz: opts.minHz,
        maxHz: opts.maxHz,
        minDecibels: opts.minDecibels,
        maxDecibels: opts.maxDecibels,
        barSmoothingAlpha: opts.barSmoothingAlpha,
      },
    );
    smoothedBarsRef.current = analysis.bars;
    const hasMeaningfulSignal = metrics.dbfs > opts.noiseFloorDbfs;

    setSnapshot({
      isRunning: true,
      elapsedSeconds: latestElapsedSecondsRef.current,
      dbfs: calibrateDbfsForDisplay(metrics.dbfs),
      peakHz: hasMeaningfulSignal ? analysis.peakHz : null,
      peakLevel: hasMeaningfulSignal ? analysis.peakLevel : null,
      bars: analysis.bars,
      error: null,
    });
  }, [
    opts.barCount,
    opts.barSmoothingAlpha,
    opts.maxDecibels,
    opts.maxHz,
    opts.minDecibels,
    opts.minHz,
    opts.noiseFloorDbfs,
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

      AudioManager.setAudioSessionOptions({
        iosCategory: "playAndRecord",
        iosMode: "measurement",
      });
      const sessionActivated = await AudioManager.setAudioSessionActivity(true);
      if (!sessionActivated) {
        setSnapshot(prev => ({
          ...prev,
          isRunning: false,
          error: "Could not activate audio session.",
        }));
        return false;
      }

      const engine = await createMicrophoneSpectrumEngine({
        sampleRate: opts.sampleRate,
        fftSize: opts.fftSize,
        smoothingTimeConstant: opts.smoothingTimeConstant,
        minDecibels: opts.minDecibels,
        maxDecibels: opts.maxDecibels,
        autoResumeContext: opts.autoResumeContext,
        onAudioMetrics: handleAudioMetrics,
      });

      freqDataRef.current = new Float32Array(engine.analyser.frequencyBinCount);
      smoothedBarsRef.current = [];
      latestElapsedSecondsRef.current = 0;
      runningRef.current = true;

      setSnapshot({
        ...createIdleMicrophoneSpectrumSnapshot(opts.barCount),
        isRunning: true,
      });
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
    handleAudioMetrics,
    stop,
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

function createIdleMicrophoneSpectrumSnapshot(
  barCount: number,
): MicrophoneSpectrumSnapshot {
  return {
    isRunning: false,
    elapsedSeconds: 0,
    dbfs: -100,
    peakHz: null,
    peakLevel: null,
    bars: Array(barCount).fill(0),
    error: null,
  };
}
