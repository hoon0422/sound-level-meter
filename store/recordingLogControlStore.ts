import { devtools } from '@csark0812/zustand-expo-devtools';
import { create } from 'zustand';

type RecordingLogControlState = {
  skipNextRecordingLog: boolean;
  consumeSkipNextRecordingLog: () => boolean;
  markNextRecordingStopAsTemporary: () => void;
};

const useRecordingLogControlStore = create<RecordingLogControlState>()(
  devtools(
    (set, get) => ({
      skipNextRecordingLog: false,
      consumeSkipNextRecordingLog: () => {
        const shouldSkip = get().skipNextRecordingLog;
        if (shouldSkip) {
          set({ skipNextRecordingLog: false }, false, 'consumeSkipNextRecordingLog');
        }
        return shouldSkip;
      },
      markNextRecordingStopAsTemporary: () =>
        set({ skipNextRecordingLog: true }, false, 'markNextRecordingStopAsTemporary'),
    }),
    {
      name: 'RecordingLogControlStore',
    }
  )
);

export default useRecordingLogControlStore;
