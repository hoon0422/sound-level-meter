import { useEffect, useRef } from 'react';
import useLogsStore from '@/store/logsStore';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import useCalibrationStore, { applyCalibrationOffset } from '@/store/calibrationStore';
import useRecordingLogControlStore from '@/store/recordingLogControlStore';

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
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const consumeSkipNextRecordingLog = useRecordingLogControlStore(state => state.consumeSkipNextRecordingLog);
  const { averageDbfs, elapsedSeconds, isRunning, maximumDbfs, minimumDbfs } = useAudioMeterStore(state => ({
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
      const shouldSkipLog = consumeSkipNextRecordingLog();
      if (stats && !shouldSkipLog) {
        const now = new Date();
        addLog({
          id: `${now.getTime()}`,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: formatDuration(stats.elapsedSeconds),
          maxDb: roundDb(applyCalibrationOffset(stats.maximumDbfs, offsetDb)),
          minDb: roundDb(applyCalibrationOffset(stats.minimumDbfs, offsetDb)),
          avgDb: roundDb(applyCalibrationOffset(stats.averageDbfs, offsetDb)),
        });
      }

      lastRunningStatsRef.current = null;
    }

    prevIsRunningRef.current = isRunning;
  }, [addLog, averageDbfs, consumeSkipNextRecordingLog, elapsedSeconds, isRunning, maximumDbfs, minimumDbfs, offsetDb]);
}
