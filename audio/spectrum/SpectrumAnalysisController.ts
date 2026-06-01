import { type MicrophoneAudioFrame, type MicrophoneController, type MicrophoneState } from '../MicrophoneController';
import { analyzeFrequencyFrame } from './spectrumAnalysis';
import { SpectrumDisplayConfig } from './types';

export type SpectrumSnapshot = {
  bars: number[];
  maximumBars: number[];
};

export type SpectrumSnapshotListener = (snapshot: SpectrumSnapshot) => void;
export type SpectrumDisposeListener = (snapshot: SpectrumSnapshot) => void;

export function createIdleSpectrumSnapshot(barCount: number): SpectrumSnapshot {
  return {
    bars: Array(barCount).fill(-200) as number[],
    maximumBars: Array(barCount).fill(-200) as number[],
  };
}

export class SpectrumAnalysisController {
  private config: SpectrumDisplayConfig;
  private smoothedBars: number[] = [];
  private maximumBars: number[] = [];
  private listeners = new Set<SpectrumSnapshotListener>();
  private disposeListeners = new Map<SpectrumSnapshotListener, SpectrumDisposeListener>();
  private lastSnapshot: SpectrumSnapshot;
  private lastMeasurementSessionId = 0;
  private unsubscribeFrame: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  constructor(mic: MicrophoneController, config: SpectrumDisplayConfig) {
    this.config = config;
    this.lastSnapshot = createIdleSpectrumSnapshot(config.barCount);

    this.unsubscribeFrame = mic.onFrame(this.handleFrame);
    this.unsubscribeState = mic.subscribe(this.handleMicState, this.handleMicDispose);
  }

  subscribe(listener: SpectrumSnapshotListener, onDispose?: SpectrumDisposeListener): () => void {
    this.listeners.add(listener);
    if (onDispose) {
      this.disposeListeners.set(listener, onDispose);
    }

    return () => {
      this.listeners.delete(listener);
      this.disposeListeners.delete(listener);
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
    this.emitDispose(this.lastSnapshot);
    this.listeners.clear();
    this.disposeListeners.clear();
    this.smoothedBars = [];
    this.maximumBars = [];
  }

  private emit(snapshot: SpectrumSnapshot) {
    this.lastSnapshot = snapshot;

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private emitDispose(snapshot: SpectrumSnapshot) {
    for (const listener of this.disposeListeners.values()) {
      listener(snapshot);
    }
  }

  private handleFrame = (frame: MicrophoneAudioFrame) => {
    if (frame.frameDurationSeconds === 0) {
      return;
    }
    const analysis = analyzeFrequencyFrame(frame.frequencyData, this.smoothedBars, {
      sampleRate: frame.sampleRate,
      fftSize: frame.fftSize,
      barCount: this.config.barCount,
      minHz: this.config.minHz,
      maxHz: this.config.maxHz,
      minDecibels: frame.minDecibels,
      maxDecibels: frame.maxDecibels,
      barSmoothingAlpha: this.config.barSmoothingAlpha,
    });
    this.smoothedBars = analysis.bars;

    if (this.maximumBars.length === analysis.bars.length) {
      this.maximumBars = this.maximumBars.map((max, i) => Math.max(max, analysis.bars[i]));
    } else {
      this.maximumBars = analysis.bars;
    }

    this.emit({
      bars: analysis.bars,
      maximumBars: this.maximumBars,
    });
  };

  private handleMicState = (state: MicrophoneState) => {
    if (state.isRunning && state.measurementSessionId !== this.lastMeasurementSessionId) {
      this.lastMeasurementSessionId = state.measurementSessionId;
      this.smoothedBars = [];
      this.maximumBars = [];
      this.emit(createIdleSpectrumSnapshot(this.config.barCount));
    }
  };

  private handleMicDispose = () => {
    this.dispose();
  };
}
