import { audioMeterStore, type AudioMeterState } from '@/store/audioMeterStore';
import { useEffect, useRef, useState } from 'react';

export function useThrottledAudioMeterValue<T>(selector: (state: AudioMeterState) => T, intervalMs: number = 300) {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const lastUpdateRef = useRef(0);
  const isRunningPrevRef = useRef(audioMeterStore.getState().isRunning);
  const [selectedValue, setSelectedValue] = useState(() => selector(audioMeterStore.getState()));

  useEffect(() => {
    let selector = selectorRef.current;
    return audioMeterStore.subscribe(state => {
      const now = Date.now();

      if (!state.isRunning && isRunningPrevRef.current) {
        // If recording just stopped, update immediately to show final values
        setSelectedValue(() => selector(state));
        lastUpdateRef.current = now;
        isRunningPrevRef.current = false;
        return;
      }

      if (isRunningPrevRef.current && now - lastUpdateRef.current < intervalMs) {
        return;
      }

      if (selectorRef.current && selectorRef.current !== selector) {
        selector = selectorRef.current;
      }
      setSelectedValue(() => selector(state));
      lastUpdateRef.current = now;
      isRunningPrevRef.current = state.isRunning && state.elapsedSeconds > 0;
    });
  }, [intervalMs]);

  return selectedValue;
}
