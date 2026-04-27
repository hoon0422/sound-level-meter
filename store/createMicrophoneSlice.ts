import {
  type AudioEngineConfig,
  MicrophoneController,
  type MicrophoneState,
  createIdleMicrophoneState,
} from '@/audio/MicrophoneController';
import type { StateCreator } from 'zustand';

export type { AudioEngineConfig };

export type MicrophoneSlice = MicrophoneState & {
  start: (config: AudioEngineConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};

export const createMicrophoneSlice: StateCreator<MicrophoneSlice> = set => {
  const mic = MicrophoneController.getInstance();

  mic.subscribe(state => set(state));

  return {
    ...createIdleMicrophoneState(),
    start: (config: AudioEngineConfig) => mic.start(config),
    stop: () => mic.stop(),
    disconnect: async () => await mic.disconnect(),
  };
};
