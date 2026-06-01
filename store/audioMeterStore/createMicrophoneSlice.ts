import { MicrophoneController, createIdleMicrophoneState } from '@/audio/MicrophoneController';
import type { StateCreator } from 'zustand';
import type { AudioEngineConfig, AudioMeterState, MicrophoneSlice } from './types';

export const createMicrophoneSlice: StateCreator<
  AudioMeterState,
  [['zustand/devtools', never]],
  [],
  MicrophoneSlice
> = set => {
  const mic = MicrophoneController.getInstance();

  mic.subscribe(state => set(state, false, 'updateMicrophoneState'));

  return {
    ...createIdleMicrophoneState(),
    connect: (config: AudioEngineConfig) => mic.connect(config),
    start: (config: AudioEngineConfig) => mic.start(config),
    stop: () => mic.stop(),
    disconnect: () => mic.disconnect(),
  };
};
