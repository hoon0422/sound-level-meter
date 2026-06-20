import { type MicrophoneAudioFrame, type MicrophoneController, type MicrophoneState } from '../MicrophoneController';
import { updateAudioVisualSpectrum } from '../visual/audioVisualValues';
import { analyzeFrequencyFrame } from './spectrumAnalysis';
import { SpectrumDisplayConfig } from './types';

const SPECTRUM_PUBLISH_INTERVAL_MS = 250;

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
  private mic: MicrophoneController;
  private config: SpectrumDisplayConfig;
  private smoothedBars: number[] = [];
  private maximumBars: number[] = [];
  private listeners = new Set<SpectrumSnapshotListener>();
  private disposeListeners = new Map<SpectrumSnapshotListener, SpectrumDisposeListener>();
  private lastSnapshot: SpectrumSnapshot;
  private lastMeasurementSessionId = 0;
  private lastPublishTimeMs = 0;
  private unsubscribeFrame: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private isMeasurementRunning = false;

  constructor(mic: MicrophoneController, config: SpectrumDisplayConfig) {
    this.mic = mic;
    this.config = config;
    this.lastSnapshot = createIdleSpectrumSnapshot(config.barCount);

    this.updateFrameSubscription();
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
    this.updateFrameSubscription();
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

  private emit(snapshot: SpectrumSnapshot, force = false) {
    this.lastSnapshot = snapshot;
    const now = Date.now();
    if (!force && now - this.lastPublishTimeMs < SPECTRUM_PUBLISH_INTERVAL_MS) {
      return;
    }
    this.lastPublishTimeMs = now;

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private emitDispose(snapshot: SpectrumSnapshot) {
    for (const listener of this.disposeListeners.values()) {
      listener(snapshot);
    }
  }

  private updateFrameSubscription() {
    if (this.config.enabled) {
      if (!this.unsubscribeFrame) {
        this.unsubscribeFrame = this.mic.onFrequencyFrame(this.handleFrame);
      }
      return;
    }

    if (!this.unsubscribeFrame) {
      return;
    }

    this.unsubscribeFrame();
    this.unsubscribeFrame = null;
  }

  private handleFrame = (frame: MicrophoneAudioFrame) => {
    if (!this.isMeasurementRunning || !this.config.enabled || frame.frameDurationSeconds === 0) {
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
      for (let i = 0; i < this.maximumBars.length; i++) {
        this.maximumBars[i] = Math.max(this.maximumBars[i], analysis.bars[i]);
      }
    } else {
      this.maximumBars = analysis.bars.slice();
    }

    const snapshot = {
      bars: analysis.bars,
      maximumBars: this.maximumBars,
    };
    updateAudioVisualSpectrum(
      snapshot.bars,
      snapshot.maximumBars,
      frame.sessionElapsedSeconds > 0 && frame.dbfs > -100
    );
    this.emit(snapshot);
  };

  private handleMicState = (state: MicrophoneState) => {
    const isMeasurementRunning = state.isRunning && state.sessionMode === 'measurement';
    this.isMeasurementRunning = isMeasurementRunning;

    if (isMeasurementRunning && state.measurementSessionId !== this.lastMeasurementSessionId) {
      this.lastMeasurementSessionId = state.measurementSessionId;
      this.smoothedBars = [];
      this.maximumBars = [];
      const snapshot = createIdleSpectrumSnapshot(this.config.barCount);
      updateAudioVisualSpectrum(snapshot.bars, snapshot.maximumBars, false);
      this.emit(snapshot, true);
    }
  };

  private handleMicDispose = () => {
    this.dispose();
  };
}
