import {
  createMicrophoneSpectrumEngine,
  getMicrophoneSpectrumEngine,
  stopMicrophoneSpectrumEngine,
} from "@/audio/microphoneSpectrumEngine";
import { analyzeSpectrumFrame } from "@/audio/spectrumAnalysis";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioManager } from "react-native-audio-api";

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

const DEFAULT_MICROPHONE_SPECTRUM_OPTIONS: Required<UseMicrophoneSpectrumOptions> =
  {
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

export function useMicrophoneSpectrum(options?: UseMicrophoneSpectrumOptions) {
  const opts = { ...DEFAULT_MICROPHONE_SPECTRUM_OPTIONS, ...options };

  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);
  const smoothedBarsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastUiUpdateRef = useRef(0);

  const [snapshot, setSnapshot] = useState<MicrophoneSpectrumSnapshot>(() =>
    createIdleMicrophoneSpectrumSnapshot(opts.barCount),
  );

  const stop = useCallback(async () => {
    runningRef.current = false;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    await stopMicrophoneSpectrumEngine();
    freqDataRef.current = null;
    timeDataRef.current = null;
    smoothedBarsRef.current = [];

    setSnapshot(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const tick = useCallback(() => {
    if (!runningRef.current) return;

    const engine = getMicrophoneSpectrumEngine();
    const freqData = freqDataRef.current;
    const timeData = timeDataRef.current;

    if (!engine || !freqData || !timeData) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    engine.analyser.getByteFrequencyData(freqData);
    engine.analyser.getFloatTimeDomainData(timeData);

    const analysis = analyzeSpectrumFrame(
      freqData,
      timeData,
      smoothedBarsRef.current,
      {
        sampleRate: engine.audioContext.sampleRate,
        fftSize: engine.analyser.fftSize,
        barCount: opts.barCount,
        minHz: opts.minHz,
        maxHz: opts.maxHz,
        noiseFloorDbfs: opts.noiseFloorDbfs,
        barSmoothingAlpha: opts.barSmoothingAlpha,
      },
    );
    smoothedBarsRef.current = analysis.bars;

    const now = Date.now();
    const uiInterval = 1000 / opts.uiFps;

    if (now - lastUiUpdateRef.current >= uiInterval) {
      lastUiUpdateRef.current = now;

      setSnapshot({
        isRunning: true,
        ...analysis,
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

      AudioManager.setAudioSessionOptions({
        iosCategory: "playAndRecord",
        iosOptions: ["defaultToSpeaker", "allowBluetoothHFP"],
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
      });

      freqDataRef.current = new Uint8Array(engine.analyser.frequencyBinCount);
      timeDataRef.current = new Float32Array(engine.analyser.fftSize);
      smoothedBarsRef.current = [];
      lastUiUpdateRef.current = 0;
      runningRef.current = true;

      setSnapshot({
        ...createIdleMicrophoneSpectrumSnapshot(opts.barCount),
        isRunning: true,
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

function createIdleMicrophoneSpectrumSnapshot(
  barCount: number,
): MicrophoneSpectrumSnapshot {
  return {
    isRunning: false,
    dbfs: -100,
    peakHz: null,
    peakLevel: null,
    bars: Array(barCount).fill(0),
    bass: 0,
    mid: 0,
    treble: 0,
    error: null,
  };
}
