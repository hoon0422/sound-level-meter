import { create } from 'zustand';

type RecordingLogControlState = {
  skipNextRecordingLog: boolean;
  consumeSkipNextRecordingLog: () => boolean;
  markNextRecordingStopAsTemporary: () => void;
};

const useRecordingLogControlStore = create<RecordingLogControlState>((set, get) => ({
  skipNextRecordingLog: false,
  consumeSkipNextRecordingLog: () => {
    const shouldSkip = get().skipNextRecordingLog;
    if (shouldSkip) {
      set({ skipNextRecordingLog: false });
    }
    return shouldSkip;
  },
  markNextRecordingStopAsTemporary: () => set({ skipNextRecordingLog: true }),
}));

export default useRecordingLogControlStore;
