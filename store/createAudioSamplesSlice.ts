import { MicrophoneController } from '@/audio/MicrophoneController';
import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';

import type { StateCreator } from 'zustand';

export type AudioSamplesSlice = {
  samples: Sample[];
  addSample: (sample: Sample) => void;
  clearSamples: () => void;
};

type Sample = { db: number; timestamp: number };
let _lastSampleTime = 0;
let _elapsedAccumulator = 0;

export const createAudioSamplesSlice: StateCreator<AudioSamplesSlice> = set => {
  const mic = MicrophoneController.getInstance();

  // isRunning 감지
  mic.subscribe(state => {
    if (!state.isRunning) {
      set({ samples: [] });
      _lastSampleTime = 0;
      _elapsedAccumulator = 0;
    }
  });

  // dbfs 데이터
  mic.onFrame(frame => {
    _elapsedAccumulator += frame.elapsedSeconds;
    const now = Date.now();
    if (now - _lastSampleTime >= 300) {
      set(prev => ({
        samples: [...prev.samples, { db: frame.dbfs + CALIBRATION_PEAK_DBFS, timestamp: _elapsedAccumulator }]
      }));
      _lastSampleTime = now;
    }
  });

  return {
    samples: [],
    addSample: (sample) => set(prev => ({ samples: [...prev.samples, sample] })),
    clearSamples: () => set({ samples: [] }),
  };
};