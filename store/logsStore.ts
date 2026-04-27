import { create } from 'zustand';

export type RecordingLog = {
  id: string;
  date: string;
  time: string;
  duration: string;
  maxDb: number;
  minDb: number;
  avgDb: number;
};

type LogsStore = {
  logs: RecordingLog[];
  addLog: (log: RecordingLog) => void;
  clearLogs: () => void;
};

const useLogsStore = create<LogsStore>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  clearLogs: () => set({ logs: [] }),
}));

export default useLogsStore;
