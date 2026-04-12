import {
  microphoneSpectrumStore,
  useMicrophoneSpectrumStore,
} from "@/stores/useMicrophoneSpectrumStore";
import { useEffect, useRef } from "react";

export type {
  MicrophoneSpectrumConfig,
  MicrophoneSpectrumSnapshot,
} from "@/stores/useMicrophoneSpectrumStore";

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

export function useMicrophoneSpectrum(options?: UseMicrophoneSpectrumOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (optionsRef.current) {
      microphoneSpectrumStore.getState().configure(optionsRef.current);
    }
  }, [
    options?.fftSize,
    options?.barCount,
    options?.minHz,
    options?.maxHz,
    options?.minDecibels,
    options?.maxDecibels,
    options?.smoothingTimeConstant,
    options?.noiseFloorDbfs,
    options?.barSmoothingAlpha,
    options?.sampleRate,
    options?.autoResumeContext,
  ]);

  const {
    start,
    stop,
    isRunning,
    elapsedSeconds,
    dbfs,
    peakHz,
    peakLevel,
    bars,
    error,
  } = useMicrophoneSpectrumStore();

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isRunning,
    elapsedSeconds,
    dbfs,
    peakHz,
    peakLevel,
    bars,
    error,
  };
}
