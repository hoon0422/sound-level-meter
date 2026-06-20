import { MicrophoneController, createIdleMicrophoneState } from '@/audio/MicrophoneController';
import type { StateCreator } from 'zustand';
import type { AudioEngineConfig, AudioMeterState, MicrophoneSlice } from './types';

const MICROPHONE_STATE_PUBLISH_INTERVAL_MS = 250;

export const createMicrophoneSlice: StateCreator<
  AudioMeterState,
  [['zustand/devtools', never]],
  [],
  MicrophoneSlice
> = set => {
  const mic = MicrophoneController.getInstance();
  let lastRunningPublishTimeMs = 0;
  let lastMeasurementSessionId = 0;

  mic.subscribe(state => {
    const now = Date.now();
    const isNewSession = state.measurementSessionId !== lastMeasurementSessionId;
    const shouldPublishImmediately =
      !state.isRunning ||
      state.isConnecting ||
      state.isStarting ||
      state.isStopping ||
      state.isDisconnecting ||
      state.error != null ||
      isNewSession;

    if (!shouldPublishImmediately && now - lastRunningPublishTimeMs < MICROPHONE_STATE_PUBLISH_INTERVAL_MS) {
      return;
    }

    if (isNewSession) {
      lastMeasurementSessionId = state.measurementSessionId;
    }
    lastRunningPublishTimeMs = now;
    set(state, false, 'updateMicrophoneState');
  });

  return {
    ...createIdleMicrophoneState(),
    connect: (config: AudioEngineConfig) => mic.connect(config),
    start: (config, options) => mic.start(config, options),
    stop: () => mic.stop(),
    disconnect: () => mic.disconnect(),
  };
};
