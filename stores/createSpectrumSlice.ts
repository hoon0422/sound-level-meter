import { MicrophoneController } from '@/audio/MicrophoneController';
import { DEFAULT_CONFIG } from '@/audio/constants';
import {
  SpectrumAnalysisController,
  type SpectrumDisplayConfig,
  type SpectrumSnapshot,
  createIdleSpectrumSnapshot,
} from '@/audio/spectrum';
import type { StateCreator } from 'zustand';

export type { SpectrumDisplayConfig };

export type SpectrumSlice = SpectrumSnapshot & {
  configureSpectrum: (config: SpectrumDisplayConfig) => void;
  disposeSpectrum: () => void;
};

export const createSpectrumSlice: StateCreator<SpectrumSlice> = set => {
  const mic = MicrophoneController.getInstance();
  const spectrum = new SpectrumAnalysisController(mic, DEFAULT_CONFIG);

  spectrum.subscribe(snapshot => set(snapshot));

  return {
    ...createIdleSpectrumSnapshot(DEFAULT_CONFIG.barCount),
    configureSpectrum: (config: SpectrumDisplayConfig) => spectrum.configure(config),
    disposeSpectrum: () => spectrum.dispose(),
  };
};
