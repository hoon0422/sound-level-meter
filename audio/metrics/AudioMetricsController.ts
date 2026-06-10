import {
  type MicrophoneAudioFrame,
  type MicrophoneController,
  type MicrophoneDbFrame,
  type MicrophoneState,
} from '../MicrophoneController';
import { type AudioMetricsSnapshot, analyzePeakFrequency, calibrateDbfsForDisplay } from './audioMetricsAnalysis';
import { AudioMetricsDisplayConfig } from './types';

const AUDIO_METRICS_PUBLISH_INTERVAL_MS = 250;

export type AudioMetricsSnapshotListener = (snapshot: AudioMetricsSnapshot) => void;
export type AudioMetricsDisposeListener = (snapshot: AudioMetricsSnapshot) => void;

export function createIdleAudioMetricsSnapshot(): AudioMetricsSnapshot {
  return {
    dbfs: -100,
    peakHz: null,
    peakLevel: null,
  };
}

export class AudioMetricsController {
  private mic: MicrophoneController;
  private config: AudioMetricsDisplayConfig;
  private listeners = new Set<AudioMetricsSnapshotListener>();
  private disposeListeners = new Map<AudioMetricsSnapshotListener, AudioMetricsDisposeListener>();
  private lastSnapshot = createIdleAudioMetricsSnapshot();
  private lastMeasurementSessionId = 0;
  private lastPublishTimeMs = 0;
  private unsubscribeFrame: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private usesFrequencyFrames = false;

  constructor(mic: MicrophoneController, config: AudioMetricsDisplayConfig) {
    this.mic = mic;
    this.config = config;

    this.updateFrameSubscription();
    this.unsubscribeState = mic.subscribe(this.handleMicState, this.handleMicDispose);
  }

  subscribe(listener: AudioMetricsSnapshotListener, onDispose?: AudioMetricsDisposeListener): () => void {
    this.listeners.add(listener);
    if (onDispose) {
      this.disposeListeners.set(listener, onDispose);
    }

    return () => {
      this.listeners.delete(listener);
      this.disposeListeners.delete(listener);
    };
  }

  configure(config: AudioMetricsDisplayConfig) {
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
  }

  private emit(snapshot: AudioMetricsSnapshot, force = false) {
    this.lastSnapshot = snapshot;
    const now = Date.now();
    if (!force && now - this.lastPublishTimeMs < AUDIO_METRICS_PUBLISH_INTERVAL_MS) {
      return;
    }
    this.lastPublishTimeMs = now;

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private emitDispose(snapshot: AudioMetricsSnapshot) {
    for (const listener of this.disposeListeners.values()) {
      listener(snapshot);
    }
  }

  private updateFrameSubscription() {
    if (this.unsubscribeFrame && this.usesFrequencyFrames === this.config.analyzePeakFrequency) {
      return;
    }

    this.unsubscribeFrame?.();
    this.usesFrequencyFrames = this.config.analyzePeakFrequency;
    this.unsubscribeFrame = this.usesFrequencyFrames
      ? this.mic.onFrequencyFrame(this.handleFrequencyFrame)
      : this.mic.onFrame(this.handleDbFrame);
  }

  private handleDbFrame = (frame: MicrophoneDbFrame) => {
    this.emit({
      dbfs: calibrateDbfsForDisplay(frame.dbfs),
      peakHz: null,
      peakLevel: null,
    });
  };

  private handleFrequencyFrame = (frame: MicrophoneAudioFrame) => {
    const { peakHz, peakLevel } = analyzePeakFrequency(
      frame.frequencyData,
      frame.sampleRate,
      frame.fftSize,
      frame.minDecibels,
      frame.maxDecibels,
      this.config.minHz,
      this.config.maxHz
    );

    this.emit({
      dbfs: calibrateDbfsForDisplay(frame.dbfs),
      peakHz,
      peakLevel,
    });
  };

  private handleMicState = (state: MicrophoneState) => {
    if (state.isRunning && state.measurementSessionId !== this.lastMeasurementSessionId) {
      this.lastMeasurementSessionId = state.measurementSessionId;
      this.emit(createIdleAudioMetricsSnapshot(), true);
    }
  };

  private handleMicDispose = () => {
    this.dispose();
  };
}
