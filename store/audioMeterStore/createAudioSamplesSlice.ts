import { MicrophoneController } from '@/audio/MicrophoneController';

import type { StateCreator } from 'zustand';
import type { AudioMeterState, AudioSamplesSlice, Sample } from './types';

let _lastSampleTime = 0;
let _elapsedAccumulator = 0;

export const createAudioSamplesSlice: StateCreator<
  AudioMeterState,
  [['zustand/devtools', never]],
  [],
  AudioSamplesSlice
> = set => {
  const mic = MicrophoneController.getInstance();
  const addSample = (sample: Sample) => set(prev => ({ samples: [...prev.samples, sample] }), false, 'addSample');
  const clearSamples = () => set({ samples: [] }, false, 'clearSamples');

  // isRunning 감지
  mic.subscribe(state => {
    if (!state.isRunning) {
      clearSamples();
      _lastSampleTime = 0;
      _elapsedAccumulator = 0;
    }
  });

  // dbfs 데이터
  mic.onFrame(frame => {
    _elapsedAccumulator += frame.elapsedSeconds;
    const now = Date.now();
    if (now - _lastSampleTime >= 300) {
      addSample({ db: frame.dbfs, timestamp: _elapsedAccumulator });
      _lastSampleTime = now;
    }
  });

  return { samples: [], addSample, clearSamples };
};
