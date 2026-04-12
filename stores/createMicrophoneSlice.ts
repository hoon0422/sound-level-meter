import {
  type AudioEngineConfig,
  MicrophoneController,
  type MicrophoneState,
  createIdleMicrophoneState,
} from "@/audio/MicrophoneController";
import type { StateCreator } from "zustand";
import type { SpectrumSlice } from "./createSpectrumSlice";

export type { AudioEngineConfig };

export type MicrophoneSlice = MicrophoneState & {
  start: (config: AudioEngineConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};

export const createMicrophoneSlice: StateCreator<
  MicrophoneSlice & SpectrumSlice,
  [],
  [],
  MicrophoneSlice
> = set => {
  const mic = MicrophoneController.getInstance();

  mic.subscribe(state => set(state));

  return {
    ...createIdleMicrophoneState(),
    start: (config: AudioEngineConfig) => mic.start(config),
    stop: () => mic.stop(),
    disconnect: async () => await mic.disconnect(),
  };
};
