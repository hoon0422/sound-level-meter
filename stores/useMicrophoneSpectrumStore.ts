import {
  type AudioEngineConfig,
  MicrophoneController,
  type MicrophoneState,
  createIdleMicrophoneState,
} from "@/audio/MicrophoneController";
import {
  DEFAULT_CONFIG,
  type MicrophoneSpectrumConfig,
} from "@/audio/constants";
import {
  SpectrumAnalysisController,
  type SpectrumDisplayConfig,
  type SpectrumSnapshot,
  createIdleSpectrumSnapshot,
} from "@/audio/spectrum";
import { createStore, useStore } from "zustand";

export type {
  AudioEngineConfig,
  MicrophoneSpectrumConfig,
  SpectrumDisplayConfig,
};

export type MicrophoneSpectrumSnapshot = MicrophoneState & SpectrumSnapshot;

type MicrophoneSpectrumState = MicrophoneSpectrumSnapshot & {
  start: (config: MicrophoneSpectrumConfig) => Promise<boolean>;
  stop: () => void;
  disconnect: () => Promise<void>;
};

export const microphoneSpectrumStore = createStore<MicrophoneSpectrumState>()(
  set => {
    const mic = MicrophoneController.getInstance();
    const spectrum = new SpectrumAnalysisController(mic, DEFAULT_CONFIG);

    mic.subscribe(state => set(state));
    spectrum.subscribe(snapshot => set(snapshot));

    return {
      ...createIdleMicrophoneState(),
      ...createIdleSpectrumSnapshot(DEFAULT_CONFIG.barCount),
      start: (config: MicrophoneSpectrumConfig) => {
        spectrum.configure(config);
        return mic.start(config);
      },
      stop: () => mic.stop(),
      disconnect: async () => {
        spectrum.dispose();
        await mic.disconnect();
      },
    };
  },
);

export function useMicrophoneSpectrumStore(): MicrophoneSpectrumState;
export function useMicrophoneSpectrumStore<T>(
  selector: (state: MicrophoneSpectrumState) => T,
): T;
export function useMicrophoneSpectrumStore<T>(
  selector?: (state: MicrophoneSpectrumState) => T,
) {
  return useStore(
    microphoneSpectrumStore,
    selector as (state: MicrophoneSpectrumState) => T,
  );
}
