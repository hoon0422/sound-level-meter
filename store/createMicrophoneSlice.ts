import {
  type AudioEngineConfig,
  MicrophoneController,
  type MicrophoneState,
  createIdleMicrophoneState,
} from '@/audio/MicrophoneController';
import type { StateCreator } from 'zustand';

export type { AudioEngineConfig };

export type MicrophoneSlice = MicrophoneState & {
  connect: (config: AudioEngineConfig) => Promise<boolean>;
  start: (config: AudioEngineConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};

export const createMicrophoneSlice: StateCreator<MicrophoneSlice> = set => {
  const mic = MicrophoneController.getInstance();

  mic.subscribe(state =>
    set({
      ...state,
      isRunning: state.isRunning && state.elapsedSeconds > 0,
    })
  );

  return {
    ...createIdleMicrophoneState(),
    connect: (config: AudioEngineConfig) => mic.connect(config),
    start: (config: AudioEngineConfig) => mic.start(config),
    stop: () => mic.stop(),
    disconnect: () => mic.disconnect(),
  };
};
