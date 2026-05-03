import { calibrateDbfsForDisplay } from '../metrics';
import { type MicrophoneAudioFrame, type MicrophoneController, type MicrophoneState } from '../MicrophoneController';
import type { StatsDisposeListener, StatsSnapshot, StatsSnapshotListener } from './types';

export function createIdleStatsSnapshot(): StatsSnapshot {
  return {
    averageDbfs: -100,
    maximumDbfs: -100,
    maximumDbfsPerFrequencyBin: [],
  };
}

export class StatsController {
  private listeners = new Set<StatsSnapshotListener>();
  private disposeListeners = new Map<StatsSnapshotListener, StatsDisposeListener>();
  private lastSnapshot = createIdleStatsSnapshot();
  private unsubscribeFrame: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private dbfsSum = 0;
  private frameCount = 0;
  private maximumDbfs = -100;
  private maximumDbfsPerFrequencyBin: number[] = [];

  constructor(mic: MicrophoneController) {
    this.unsubscribeFrame = mic.onFrame(this.handleFrame);
    this.unsubscribeState = mic.subscribe(this.handleMicState, this.handleMicDispose);
  }

  subscribe(listener: StatsSnapshotListener, onDispose?: StatsDisposeListener): () => void {
    this.listeners.add(listener);
    if (onDispose) {
      this.disposeListeners.set(listener, onDispose);
    }

    return () => {
      this.listeners.delete(listener);
      this.disposeListeners.delete(listener);
    };
  }

  reset() {
    this.dbfsSum = 0;
    this.frameCount = 0;
    this.maximumDbfs = -100;
    this.maximumDbfsPerFrequencyBin = [];
    this.emit(createIdleStatsSnapshot());
  }

  dispose() {
    this.unsubscribeFrame?.();
    this.unsubscribeState?.();
    this.unsubscribeFrame = null;
    this.unsubscribeState = null;
    this.emitDispose(this.lastSnapshot);
    this.listeners.clear();
    this.disposeListeners.clear();
    this.resetAccumulatedStats();
  }

  private emit(snapshot: StatsSnapshot) {
    this.lastSnapshot = snapshot;

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private emitDispose(snapshot: StatsSnapshot) {
    for (const listener of this.disposeListeners.values()) {
      listener(snapshot);
    }
  }

  private resetAccumulatedStats() {
    this.dbfsSum = 0;
    this.frameCount = 0;
    this.maximumDbfs = -100;
    this.maximumDbfsPerFrequencyBin = [];
  }

  private handleFrame = (frame: MicrophoneAudioFrame) => {
    const dbfs = calibrateDbfsForDisplay(Number.isFinite(frame.dbfs) ? frame.dbfs : -100);

    this.dbfsSum += dbfs;
    this.frameCount++;
    this.maximumDbfs = Math.max(this.maximumDbfs, dbfs);

    if (this.maximumDbfsPerFrequencyBin.length !== frame.frequencyData.length) {
      this.maximumDbfsPerFrequencyBin = Array(frame.frequencyData.length).fill(frame.minDecibels) as number[];
    }

    for (let i = 0; i < frame.frequencyData.length; i++) {
      const value = frame.frequencyData[i];
      this.maximumDbfsPerFrequencyBin[i] = Math.max(
        this.maximumDbfsPerFrequencyBin[i],
        Number.isFinite(value) ? value : frame.minDecibels
      );
    }

    this.emit({
      averageDbfs: this.dbfsSum / this.frameCount,
      maximumDbfs: this.maximumDbfs,
      maximumDbfsPerFrequencyBin: [...this.maximumDbfsPerFrequencyBin],
    });
  };

  private handleMicState = (state: MicrophoneState) => {
    if (!state.isRunning && !state.isConnecting && !state.isStarting && !state.isDisconnecting) {
      this.reset();
    }
  };

  private handleMicDispose = () => {
    this.dispose();
  };
}
