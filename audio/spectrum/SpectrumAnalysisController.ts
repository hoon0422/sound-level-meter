import {
  type MicrophoneAudioFrame,
  type MicrophoneController,
  type MicrophoneState,
} from "../MicrophoneController";
import { analyzeFrequencyFrame } from "./spectrumAnalysis";
import { SpectrumDisplayConfig } from "./types";

export type SpectrumSnapshot = {
  bars: number[];
<<<<<<< HEAD
=======
  peakHz: number | null;
  peakLevel: number | null;
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
};

export type SpectrumSnapshotListener = (snapshot: SpectrumSnapshot) => void;

export function createIdleSpectrumSnapshot(barCount: number): SpectrumSnapshot {
  return {
<<<<<<< HEAD
    bars: Array(barCount).fill(-100) as number[],
=======
    bars: Array(barCount).fill(0) as number[],
    peakHz: null,
    peakLevel: null,
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
  };
}

export class SpectrumAnalysisController {
  private config: SpectrumDisplayConfig;
  private smoothedBars: number[] = [];
  private listeners = new Set<SpectrumSnapshotListener>();
  private unsubscribeFrame: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  constructor(mic: MicrophoneController, config: SpectrumDisplayConfig) {
    this.config = config;

    this.unsubscribeFrame = mic.onFrame(this.handleFrame);
    this.unsubscribeState = mic.subscribe(this.handleMicState);
  }

  subscribe(listener: SpectrumSnapshotListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  configure(config: SpectrumDisplayConfig) {
    this.config = config;
  }

  dispose() {
    this.unsubscribeFrame?.();
    this.unsubscribeState?.();
    this.unsubscribeFrame = null;
    this.unsubscribeState = null;
    this.listeners.clear();
    this.smoothedBars = [];
  }

  private emit(snapshot: SpectrumSnapshot) {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private handleFrame = (frame: MicrophoneAudioFrame) => {
    const analysis = analyzeFrequencyFrame(
      frame.frequencyData,
      this.smoothedBars,
      {
        sampleRate: frame.sampleRate,
        fftSize: frame.fftSize,
        barCount: this.config.barCount,
        minHz: this.config.minHz,
        maxHz: this.config.maxHz,
        minDecibels: frame.minDecibels,
        maxDecibels: frame.maxDecibels,
        barSmoothingAlpha: this.config.barSmoothingAlpha,
      },
    );
    this.smoothedBars = analysis.bars;

<<<<<<< HEAD
    this.emit({
      bars: analysis.bars,
=======
    const hasMeaningfulSignal = frame.dbfs > this.config.noiseFloorDbfs;

    this.emit({
      bars: analysis.bars,
      peakHz: hasMeaningfulSignal ? analysis.peakHz : null,
      peakLevel: hasMeaningfulSignal ? analysis.peakLevel : null,
>>>>>>> 51a2880 (feat: restructure audio processing with new microphone and spectrum analysis controllers, integrating zustand for state management)
    });
  };

  private handleMicState = (state: MicrophoneState) => {
    if (!state.isRunning && !state.isStarting && !state.isDisconnecting) {
      this.smoothedBars = [];
      this.emit(createIdleSpectrumSnapshot(this.config.barCount));
    }
  };
}
