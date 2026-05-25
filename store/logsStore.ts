import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  deleteLog: (id: string) => void;
  clearLogs: () => void;
};

function getPersistedLogs(persistedState: unknown) {
  if (!persistedState || typeof persistedState !== 'object' || !('logs' in persistedState)) {
    return [];
  }

  const { logs } = persistedState as { logs?: unknown };
  return Array.isArray(logs) ? (logs as RecordingLog[]) : [];
}

function mergeLogs(currentLogs: RecordingLog[], persistedLogs: RecordingLog[]) {
  const seenIds = new Set<string>();

  return [...currentLogs, ...persistedLogs].filter(log => {
    if (seenIds.has(log.id)) {
      return false;
    }

    seenIds.add(log.id);
    return true;
  });
}

const useLogsStore = create<LogsStore>()(
  persist(
    set => ({
      logs: [],
      addLog: log => set(state => ({ logs: [log, ...state.logs] })),
      deleteLog: id => set(state => ({ logs: state.logs.filter(log => log.id !== id) })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'recording-logs-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ logs: state.logs }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        logs: mergeLogs(currentState.logs, getPersistedLogs(persistedState)),
      }),
    }
  )
);

export default useLogsStore;
