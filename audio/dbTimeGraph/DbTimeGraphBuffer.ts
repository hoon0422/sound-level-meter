import { MicrophoneController, type MicrophoneAudioFrame, type MicrophoneState } from '@/audio/MicrophoneController';
import { calibrateDbfsForDisplay } from '@/audio/metrics';
import { DB_TIME_GRAPH_DB_MIN, DB_TIME_GRAPH_SAMPLE_INTERVAL_MS, DB_TIME_GRAPH_WINDOW_DURATION_MS } from './constants';
import type { DbTimeGraphConfig, DbTimeGraphSample, DbTimeGraphSnapshot } from './types';

type DbTimeGraphListener = () => void;

const DEFAULT_CONFIG: DbTimeGraphConfig = {
  windowDurationMs: DB_TIME_GRAPH_WINDOW_DURATION_MS,
  sampleIntervalMs: DB_TIME_GRAPH_SAMPLE_INTERVAL_MS,
};

function createEmptySnapshot(config: DbTimeGraphConfig, version = 0, isRunning = false): DbTimeGraphSnapshot {
  return {
    samples: [],
    isRunning,
    windowStartSeconds: 0,
    windowEndSeconds: config.windowDurationMs / 1000,
    version,
  };
}

export class DbTimeGraphBuffer {
  private config: DbTimeGraphConfig;
  private samples: DbTimeGraphSample[] = [];
  private listeners = new Set<DbTimeGraphListener>();
  private snapshot: DbTimeGraphSnapshot;
  private isRunning = false;
  private activeMeasurementSessionId = 0;
  private lastSampleElapsedSeconds: number | null = null;
  private hasDrawableSample = false;
  private version = 0;

  constructor(mic: MicrophoneController, config: DbTimeGraphConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.snapshot = createEmptySnapshot(config);

    mic.onFrame(this.handleFrame);
    mic.subscribe(this.handleMicrophoneState);
  }

  subscribe = (listener: DbTimeGraphListener) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private handleMicrophoneState = (state: MicrophoneState) => {
    if (state.isRunning && state.measurementSessionId !== this.activeMeasurementSessionId) {
      this.activeMeasurementSessionId = state.measurementSessionId;
      this.samples = [];
      this.lastSampleElapsedSeconds = null;
      this.hasDrawableSample = false;
      this.isRunning = true;
      this.emit();
      return;
    }

    if (state.isDisconnecting) {
      this.samples = [];
      this.lastSampleElapsedSeconds = null;
      this.hasDrawableSample = false;
      this.isRunning = false;
      this.emit();
      return;
    }

    if (state.isRunning !== this.isRunning) {
      this.isRunning = state.isRunning;
      this.emit();
    }
  };

  private handleFrame = (frame: MicrophoneAudioFrame) => {
    if (!this.isRunning || frame.frameDurationSeconds === 0) {
      return;
    }

    const elapsedSeconds = frame.sessionElapsedSeconds;
    const sampleIntervalSeconds = this.config.sampleIntervalMs / 1000;
    if (
      this.lastSampleElapsedSeconds !== null &&
      elapsedSeconds - this.lastSampleElapsedSeconds < sampleIntervalSeconds
    ) {
      return;
    }

    this.lastSampleElapsedSeconds = elapsedSeconds;
    const db = calibrateDbfsForDisplay(Number.isFinite(frame.dbfs) ? frame.dbfs : -100);
    const isInitial = !this.hasDrawableSample && db <= DB_TIME_GRAPH_DB_MIN;
    if (!isInitial) {
      this.hasDrawableSample = true;
    }

    this.samples.push({
      db,
      isInitial,
      sessionElapsedSeconds: elapsedSeconds,
    });
    this.trim(elapsedSeconds);
    this.emit();
  };

  private trim(latestElapsedSeconds: number) {
    const windowDurationSeconds = this.config.windowDurationMs / 1000;
    const cutoffSeconds = Math.max(0, latestElapsedSeconds - windowDurationSeconds);
    while (this.samples.length > 0 && this.samples[0].sessionElapsedSeconds < cutoffSeconds) {
      this.samples.shift();
    }
  }

  private createSnapshot(): DbTimeGraphSnapshot {
    const windowDurationSeconds = this.config.windowDurationMs / 1000;
    const latestElapsedSeconds = this.samples.at(-1)?.sessionElapsedSeconds ?? 0;
    const windowEndSeconds = Math.max(windowDurationSeconds, latestElapsedSeconds);
    const windowStartSeconds = Math.max(0, windowEndSeconds - windowDurationSeconds);

    return {
      samples: this.samples.slice(),
      isRunning: this.isRunning,
      windowStartSeconds,
      windowEndSeconds,
      version: this.version,
    };
  }

  private emit() {
    this.version++;
    this.snapshot = this.createSnapshot();

    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const dbTimeGraphBuffer = new DbTimeGraphBuffer(MicrophoneController.getInstance());
