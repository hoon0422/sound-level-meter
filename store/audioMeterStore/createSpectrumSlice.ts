import { MicrophoneController } from '@/audio/MicrophoneController';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { SpectrumAnalysisController, type SpectrumDisplayConfig, createIdleSpectrumSnapshot } from '@/audio/spectrum';
import type { StateCreator } from 'zustand';
import type { AudioMeterState, SpectrumSlice } from './types';

export const createSpectrumSlice: StateCreator<
  AudioMeterState,
  [['zustand/devtools', never]],
  [],
  SpectrumSlice
> = set => {
  const mic = MicrophoneController.getInstance();
  const spectrum = new SpectrumAnalysisController(mic, DEFAULT_CONFIG);

  spectrum.subscribe(snapshot => set(snapshot, false, 'updateSpectrum'));

  return {
    ...createIdleSpectrumSnapshot(DEFAULT_CONFIG.barCount),
    configureSpectrum: (config: SpectrumDisplayConfig) => spectrum.configure(config),
    // disposeSpectrum: () => spectrum.dispose(),
  };
};
