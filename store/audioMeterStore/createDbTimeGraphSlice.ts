import {
  DB_TIME_GRAPH_DB_MIN,
  DB_TIME_GRAPH_SAMPLE_INTERVAL_MS,
  DB_TIME_GRAPH_WINDOW_DURATION_MS,
  type DbTimeGraphSample,
} from '@/audio/dbTimeGraph';
import { MicrophoneController, type MicrophoneAudioFrame, type MicrophoneState } from '@/audio/MicrophoneController';
import { calibrateDbfsForDisplay } from '@/audio/metrics';
import type { StateCreator } from 'zustand';
import type { AudioMeterState, DbTimeGraphSlice } from './types';

let _samples: DbTimeGraphSample[] = [];
let _activeMeasurementSessionId = 0;
let _lastSampleElapsedSeconds: number | null = null;
let _hasDrawableSample = false;
let _version = 0;

function createDbTimeGraphSnapshot(isRunning: boolean): DbTimeGraphSlice {
  const windowDurationSeconds = DB_TIME_GRAPH_WINDOW_DURATION_MS / 1000;
  const latestElapsedSeconds = _samples.at(-1)?.sessionElapsedSeconds ?? 0;
  const windowEndSeconds = Math.max(windowDurationSeconds, latestElapsedSeconds);
  const windowStartSeconds = Math.max(0, windowEndSeconds - windowDurationSeconds);

  return {
    dbTimeGraphSamples: _samples.slice(),
    dbTimeGraphIsRunning: isRunning,
    dbTimeGraphWindowStartSeconds: windowStartSeconds,
    dbTimeGraphWindowEndSeconds: windowEndSeconds,
    dbTimeGraphVersion: _version,
  };
}

function trimSamples(latestElapsedSeconds: number) {
  const windowDurationSeconds = DB_TIME_GRAPH_WINDOW_DURATION_MS / 1000;
  const cutoffSeconds = Math.max(0, latestElapsedSeconds - windowDurationSeconds);
  while (_samples.length > 0 && _samples[0].sessionElapsedSeconds < cutoffSeconds) {
    _samples.shift();
  }
}

function resetSamples() {
  _samples = [];
  _lastSampleElapsedSeconds = null;
  _hasDrawableSample = false;
}

export const createDbTimeGraphSlice: StateCreator<
  AudioMeterState,
  [['zustand/devtools', never]],
  [],
  DbTimeGraphSlice
> = (set, get) => {
  const mic = MicrophoneController.getInstance();

  const publish = (isRunning: boolean, action: string) => {
    _version++;
    set(createDbTimeGraphSnapshot(isRunning), false, action);
  };

  const handleMicrophoneState = (state: MicrophoneState) => {
    if (state.isRunning && state.measurementSessionId !== _activeMeasurementSessionId) {
      _activeMeasurementSessionId = state.measurementSessionId;
      resetSamples();
      publish(true, 'dbTimeGraph/startSession');
      return;
    }

    if (state.isDisconnecting) {
      resetSamples();
      publish(false, 'dbTimeGraph/disconnect');
      return;
    }

    if (state.isRunning !== get().dbTimeGraphIsRunning) {
      publish(state.isRunning, 'dbTimeGraph/setRunning');
    }
  };

  const handleFrame = (frame: MicrophoneAudioFrame) => {
    if (!get().dbTimeGraphIsRunning || frame.frameDurationSeconds === 0) {
      return;
    }

    const elapsedSeconds = frame.sessionElapsedSeconds;
    const sampleIntervalSeconds = DB_TIME_GRAPH_SAMPLE_INTERVAL_MS / 1000;
    if (_lastSampleElapsedSeconds !== null && elapsedSeconds - _lastSampleElapsedSeconds < sampleIntervalSeconds) {
      return;
    }

    _lastSampleElapsedSeconds = elapsedSeconds;
    const db = calibrateDbfsForDisplay(Number.isFinite(frame.dbfs) ? frame.dbfs : -100);
    const isInitial = !_hasDrawableSample && db <= DB_TIME_GRAPH_DB_MIN;
    if (!isInitial) {
      _hasDrawableSample = true;
    }

    _samples.push({
      db,
      isInitial,
      sessionElapsedSeconds: elapsedSeconds,
    });
    trimSamples(elapsedSeconds);
    publish(true, 'dbTimeGraph/addSample');
  };

  mic.subscribe(handleMicrophoneState);
  mic.onFrame(handleFrame);

  return createDbTimeGraphSnapshot(false);
};
