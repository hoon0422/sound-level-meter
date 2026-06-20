import { calibrateDbfsForDisplay } from '../metrics';
import { type MicrophoneController, type MicrophoneDbFrame, type MicrophoneState } from '../MicrophoneController';
import type { StatsDisposeListener, StatsSnapshot, StatsSnapshotListener } from './types';

const STATS_PUBLISH_INTERVAL_MS = 250;

export function createIdleStatsSnapshot(): StatsSnapshot {
  return {
    averageDbfs: -100,
    minimumDbfs: 1000,
    maximumDbfs: -100,
    validFrameCount: 0,
  };
}

export class StatsController {
  private listeners = new Set<StatsSnapshotListener>();
  private disposeListeners = new Map<StatsSnapshotListener, StatsDisposeListener>();
  private lastSnapshot = createIdleStatsSnapshot();
  private unsubscribeFrame: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private dbfsSum = 0;
  private dbfsSampleCount = 0;
  private minimumDbfs = 1000;
  private maximumDbfs = -100;
  private lastMeasurementSessionId = 0;
  private lastPublishTimeMs = 0;
  private isRunning = false;

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
    this.dbfsSampleCount = 0;
    this.minimumDbfs = 1000;
    this.maximumDbfs = -100;
    this.emit(createIdleStatsSnapshot(), true);
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

  private emit(snapshot: StatsSnapshot, force = false) {
    this.lastSnapshot = snapshot;
    const now = Date.now();
    if (!force && now - this.lastPublishTimeMs < STATS_PUBLISH_INTERVAL_MS) {
      return;
    }
    this.lastPublishTimeMs = now;

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
    this.dbfsSampleCount = 0;
    this.minimumDbfs = 1000;
    this.maximumDbfs = -100;
  }

  private handleFrame = (frame: MicrophoneDbFrame) => {
    if (!this.isRunning) {
      return;
    }

    const dbfs = calibrateDbfsForDisplay(Number.isFinite(frame.dbfs) ? frame.dbfs : -100);

    this.dbfsSum += dbfs;
    this.dbfsSampleCount++;
    this.minimumDbfs = Math.min(this.minimumDbfs, dbfs);
    this.maximumDbfs = Math.max(this.maximumDbfs, dbfs);

    this.emit({
      averageDbfs: this.dbfsSum / this.dbfsSampleCount,
      minimumDbfs: this.minimumDbfs,
      maximumDbfs: this.maximumDbfs,
      validFrameCount: this.dbfsSampleCount,
    });
  };

  private handleMicState = (state: MicrophoneState) => {
    const isMeasurementRunning = state.isRunning && state.sessionMode === 'measurement';

    if (isMeasurementRunning && state.measurementSessionId !== this.lastMeasurementSessionId) {
      this.lastMeasurementSessionId = state.measurementSessionId;
      this.isRunning = true;
      this.reset();
      return;
    }

    if (!isMeasurementRunning && this.isRunning) {
      this.isRunning = false;
      this.emit(this.lastSnapshot, true);
    }
  };

  private handleMicDispose = () => {
    this.dispose();
  };
}
