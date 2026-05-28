import { devtools } from '@csark0812/zustand-expo-devtools';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createAudioMetricsSlice } from './createAudioMetricsSlice';
import { createMicrophoneSlice } from './createMicrophoneSlice';
import { createSpectrumSlice } from './createSpectrumSlice';
import { createStatsSlice } from './createStatsSlice';
import type { AudioMeterState } from './types';

export type * from './types';

export const audioMeterStore = createStore<AudioMeterState>()(
  devtools(
    (set, get, store) => ({
      ...createMicrophoneSlice(set, get, store),
      ...createSpectrumSlice(set, get, store),
      ...createAudioMetricsSlice(set, get, store),
      ...createStatsSlice(set, get, store),
    }),
    {
      name: 'AudioMeterStore',
    }
  )
);

export function useAudioMeterStore(): AudioMeterState;
export function useAudioMeterStore<T>(selector: (state: AudioMeterState) => T): T;
export function useAudioMeterStore<T>(selector?: (state: AudioMeterState) => T) {
  return useStore(
    audioMeterStore,
    useShallow((selector ?? ((state: AudioMeterState) => state)) as (state: AudioMeterState) => T)
  );
}
