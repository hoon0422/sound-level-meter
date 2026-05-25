import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const CALIBRATION_OFFSET_MIN_DB = -20;
export const CALIBRATION_OFFSET_MAX_DB = 20;
export const CALIBRATION_OFFSET_STEP_DB = 0.1;

type CalibrationState = {
  offsetDb: number;
  decrementOffset: () => void;
  incrementOffset: () => void;
  setOffsetDb: (offsetDb: number) => void;
};

function clampOffset(offsetDb: number) {
  return Math.min(CALIBRATION_OFFSET_MAX_DB, Math.max(CALIBRATION_OFFSET_MIN_DB, offsetDb));
}

function normalizeOffset(offsetDb: number) {
  return parseFloat(clampOffset(offsetDb).toFixed(1));
}

export function applyCalibrationOffset(db: number, offsetDb: number) {
  return db + offsetDb;
}

export function formatCalibrationOffset(offsetDb: number) {
  if (offsetDb > 0) return `+${offsetDb.toFixed(1)} dB`;
  return `${offsetDb.toFixed(1)} dB`;
}

const useCalibrationStore = create<CalibrationState>()(
  persist(
    set => ({
      offsetDb: 0,
      decrementOffset: () =>
        set(state => ({
          offsetDb: normalizeOffset(state.offsetDb - CALIBRATION_OFFSET_STEP_DB),
        })),
      incrementOffset: () =>
        set(state => ({
          offsetDb: normalizeOffset(state.offsetDb + CALIBRATION_OFFSET_STEP_DB),
        })),
      setOffsetDb: offsetDb => set({ offsetDb: normalizeOffset(offsetDb) }),
    }),
    {
      name: 'calibration-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useCalibrationStore;
