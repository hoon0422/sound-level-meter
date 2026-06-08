import { useEffect, useRef } from 'react';
import useLogsStore from '@/store/logsStore';
import { audioMeterStore } from '@/store/audioMeterStore';
import useCalibrationStore, { applyCalibrationOffset } from '@/store/calibrationStore';
import useRecordingLogControlStore from '@/store/recordingLogControlStore';

type LogStatsSnapshot = {
  averageDbfs: number;
  elapsedSeconds: number;
  maximumDbfs: number;
  minimumDbfs: number;
  validFrameCount: number;
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
  const addLog = useLogsStore(state => state.addLog);
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const consumeSkipNextRecordingLog = useRecordingLogControlStore(state => state.consumeSkipNextRecordingLog);

  const lastRunningStatsRef = useRef<LogStatsSnapshot | null>(null);
  const prevIsRunningRef = useRef(false);
  const offsetDbRef = useRef(offsetDb);

  useEffect(() => {
    offsetDbRef.current = offsetDb;
  }, [offsetDb]);

  useEffect(() => {
    return audioMeterStore.subscribe(state => {
      if (state.isRunning) {
        lastRunningStatsRef.current = {
          averageDbfs: state.averageDbfs,
          elapsedSeconds: state.elapsedSeconds,
          maximumDbfs: state.maximumDbfs,
          minimumDbfs: state.minimumDbfs,
          validFrameCount: state.validFrameCount,
        };
      }

      if (!state.isRunning && prevIsRunningRef.current) {
        const stats = lastRunningStatsRef.current;
        const shouldSkipLog = consumeSkipNextRecordingLog();
        if (stats && !shouldSkipLog) {
          const now = new Date();
          const activeOffsetDb = offsetDbRef.current;
          const minimumDbfs = stats.validFrameCount > 0 ? stats.minimumDbfs : -100;
          addLog({
            id: `${now.getTime()}`,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: formatDuration(stats.elapsedSeconds),
            maxDb: roundDb(applyCalibrationOffset(stats.maximumDbfs, activeOffsetDb)),
            minDb: roundDb(applyCalibrationOffset(minimumDbfs, activeOffsetDb)),
            avgDb: roundDb(applyCalibrationOffset(stats.averageDbfs, activeOffsetDb)),
          });
        }

        lastRunningStatsRef.current = null;
      }

      prevIsRunningRef.current = state.isRunning;
    });
  }, [addLog, consumeSkipNextRecordingLog]);
}
