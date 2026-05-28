import { dbTimeGraphBuffer } from '@/audio/dbTimeGraph';
import { useSyncExternalStore } from 'react';

export function useDbTimeGraphSnapshot() {
  return useSyncExternalStore(
    dbTimeGraphBuffer.subscribe,
    dbTimeGraphBuffer.getSnapshot,
    dbTimeGraphBuffer.getSnapshot
  );
}
