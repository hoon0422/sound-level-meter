import { useEffect, useRef } from 'react';
import useLogsStore from '@/store/logsStore';
import { useMicrophoneSpectrumStore } from '@/store/microphoneSpectrumStore';

type LogStatsSnapshot = {
  averageDbfs: number;
  elapsedSeconds: number;
  maximumDbfs: number;
  minimumDbfs: number;
};

function formatDuration(elapsedSeconds: number) {
  const durationSec = Math.floor(elapsedSeconds);
  const durationMin = Math.floor(durationSec / 60);
  const durationRemSec = durationSec % 60;

  return durationMin > 0 ? `${durationMin}m ${durationRemSec}s` : `${durationRemSec}s`;
}

function roundDb(dbfs: number) {
  return parseFloat(dbfs.toFixed(1));
}

export function useRecordingLogger() {
  const { addLog } = useLogsStore();
  const { averageDbfs, elapsedSeconds, isRunning, maximumDbfs, minimumDbfs } = useMicrophoneSpectrumStore(state => ({
    averageDbfs: state.averageDbfs,
    elapsedSeconds: state.elapsedSeconds,
    isRunning: state.isRunning,
    maximumDbfs: state.maximumDbfs,
    minimumDbfs: state.minimumDbfs,
  }));

  const lastRunningStatsRef = useRef<LogStatsSnapshot | null>(null);
  const prevIsRunningRef = useRef(false);

  useEffect(() => {
    if (isRunning) {
      lastRunningStatsRef.current = {
        averageDbfs,
        elapsedSeconds,
        maximumDbfs,
        minimumDbfs,
      };
    }

    if (!isRunning && prevIsRunningRef.current) {
      const stats = lastRunningStatsRef.current;
      if (stats) {
        const now = new Date();
        addLog({
          id: `${now.getTime()}`,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: formatDuration(stats.elapsedSeconds),
          maxDb: roundDb(stats.maximumDbfs),
          minDb: roundDb(stats.minimumDbfs),
          avgDb: roundDb(stats.averageDbfs),
        });
      }

      lastRunningStatsRef.current = null;
    }

    prevIsRunningRef.current = isRunning;
  }, [addLog, averageDbfs, elapsedSeconds, isRunning, maximumDbfs, minimumDbfs]);
}
