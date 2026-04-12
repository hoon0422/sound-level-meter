import type { MicrophoneSpectrumConfig } from "@/audio/constants";
import { createStore, useStore } from "zustand";
import {
  type AudioEngineConfig,
  type MicrophoneSlice,
  createMicrophoneSlice,
} from "./createMicrophoneSlice";
import {
  type SpectrumDisplayConfig,
  type SpectrumSlice,
  createSpectrumSlice,
} from "./createSpectrumSlice";

export type {
  AudioEngineConfig,
  MicrophoneSpectrumConfig,
  SpectrumDisplayConfig,
};

type MicrophoneSpectrumState = MicrophoneSlice & SpectrumSlice;

export const microphoneSpectrumStore = createStore<MicrophoneSpectrumState>()(
  (...a) => ({
    ...createMicrophoneSlice(...a),
    ...createSpectrumSlice(...a),
  }),
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
