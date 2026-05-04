import { type MicrophoneAudioFrame, type MicrophoneController, type MicrophoneState } from '../MicrophoneController';
import { analyzeFrequencyFrame } from './spectrumAnalysis';
import { SpectrumDisplayConfig } from './types';

export type SpectrumSnapshot = {
  bars: number[];
};

export type SpectrumSnapshotListener = (snapshot: SpectrumSnapshot) => void;
export type SpectrumDisposeListener = (snapshot: SpectrumSnapshot) => void;

export function createIdleSpectrumSnapshot(barCount: number): SpectrumSnapshot {
  return {
    bars: Array(barCount).fill(-100) as number[],
  };
}

export class SpectrumAnalysisController {
  private config: SpectrumDisplayConfig;
  private smoothedBars: number[] = [];
  private listeners = new Set<SpectrumSnapshotListener>();
  private disposeListeners = new Map<SpectrumSnapshotListener, SpectrumDisposeListener>();
  private lastSnapshot: SpectrumSnapshot;
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

    this.emit({
      bars: analysis.bars,
    });
  };

  private handleMicState = (state: MicrophoneState) => {
    if (!state.isRunning && !state.isConnecting && !state.isStarting && !state.isDisconnecting) {
      this.smoothedBars = [];
      this.emit(createIdleSpectrumSnapshot(this.config.barCount));
    }
  };

  private handleMicDispose = () => {
    this.dispose();
  };
}
