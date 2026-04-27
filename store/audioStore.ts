import { create } from 'zustand';

type Sample = {
  db: number;
  timestamp: number;
};

export type RecordingLog = {
  id: string;
  date: string;
  time: string;
  duration: string;
  maxDb: number;
  minDb: number;
  avgDb: number;
};

type AudioStore = {
  isRecording: boolean;
  metering: number | undefined;
  samples: Sample[];
  recordingStartTime: number | null;
  logs: RecordingLog[];
  setIsRecording: (val: boolean) => void;
  setMetering: (val: number | undefined) => void;
  addSample: (sample: Sample) => void;
  clearSamples: () => void;
  setRecordingStartTime: (t: number | null) => void;
  addLog: (log: RecordingLog) => void;
  clearLogs: () => void;
};

const useAudioStore = create<AudioStore>(set => ({
  isRecording: false,
  metering: undefined,
  samples: [],
  recordingStartTime: null,
  logs: [],
  setIsRecording: val => set({ isRecording: val }),
  setMetering: val => set({ metering: val }),
  addSample: sample => set(state => ({ samples: [...state.samples, sample] })),
  clearSamples: () => set({ samples: [], recordingStartTime: null }),
  setRecordingStartTime: t => set({ recordingStartTime: t }),
  addLog: log => set(state => ({ logs: [log, ...state.logs] })),
  clearLogs: () => set({ logs: [] }),
}));

export default useAudioStore;
