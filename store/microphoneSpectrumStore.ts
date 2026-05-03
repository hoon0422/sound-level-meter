import type { MicrophoneSpectrumConfig } from '@/audio/constants';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  type AudioMetricsDisplayConfig,
  type AudioMetricsSlice,
  createAudioMetricsSlice,
} from './createAudioMetricsSlice';
import { type AudioEngineConfig, type MicrophoneSlice, createMicrophoneSlice } from './createMicrophoneSlice';
import { type SpectrumDisplayConfig, type SpectrumSlice, createSpectrumSlice } from './createSpectrumSlice';

export type { AudioEngineConfig, AudioMetricsDisplayConfig, MicrophoneSpectrumConfig, SpectrumDisplayConfig };

type MicrophoneSpectrumState = MicrophoneSlice & SpectrumSlice & AudioMetricsSlice;

export const microphoneSpectrumStore = createStore<MicrophoneSpectrumState>()((set, get, store) => ({
  ...createMicrophoneSlice(set, get, store),
  ...createSpectrumSlice(set, get, store),
  ...createAudioMetricsSlice(set, get, store),
}));

export function useMicrophoneSpectrumStore(): MicrophoneSpectrumState;
export function useMicrophoneSpectrumStore<T>(selector: (state: MicrophoneSpectrumState) => T): T;
export function useMicrophoneSpectrumStore<T>(selector?: (state: MicrophoneSpectrumState) => T) {
  return useStore(
    microphoneSpectrumStore,
    useShallow((selector ?? ((state: MicrophoneSpectrumState) => state)) as (state: MicrophoneSpectrumState) => T)
  );
}
