import type { AudioMeterConfig } from '@/audio/constants';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  type AudioMetricsDisplayConfig,
  type AudioMetricsSlice,
  createAudioMetricsSlice,
} from './createAudioMetricsSlice';
import { type AudioEngineConfig, type MicrophoneSlice, createMicrophoneSlice } from './createMicrophoneSlice';
import { type SpectrumDisplayConfig, type SpectrumSlice, createSpectrumSlice } from './createSpectrumSlice';
import { type StatsSlice, createStatsSlice } from './createStatsSlice';

export type { AudioEngineConfig, AudioMeterConfig, AudioMetricsDisplayConfig, SpectrumDisplayConfig };

export type AudioMeterState = MicrophoneSlice & SpectrumSlice & AudioMetricsSlice & StatsSlice;

export const audioMeterStore = createStore<AudioMeterState>()((set, get, store) => ({
  ...createMicrophoneSlice(set, get, store),
  ...createSpectrumSlice(set, get, store),
  ...createAudioMetricsSlice(set, get, store),
  ...createStatsSlice(set, get, store),
}));

export function useAudioMeterStore(): AudioMeterState;
export function useAudioMeterStore<T>(selector: (state: AudioMeterState) => T): T;
export function useAudioMeterStore<T>(selector?: (state: AudioMeterState) => T) {
  return useStore(
    audioMeterStore,
    useShallow((selector ?? ((state: AudioMeterState) => state)) as (state: AudioMeterState) => T)
  );
}
