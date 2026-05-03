import { audioMeterStore, type AudioMeterState } from '@/store/audioMeterStore';
import { useEffect, useRef, useState } from 'react';

export function useThrottledAudioMeterValue<T>(selector: (state: AudioMeterState) => T, intervalMs: number = 300) {
  const selectorRef = useRef(selector);
  const lastUpdateRef = useRef(0);
  const selectedValueRef = useRef(selector(audioMeterStore.getState()));
  const [selectedValue, setSelectedValue] = useState(selectedValueRef.current);

  selectorRef.current = selector;

  useEffect(() => {
    return audioMeterStore.subscribe(state => {
      if (state.elapsedSeconds === 0) {
        return;
      }
      const now = Date.now();
      if (now - lastUpdateRef.current < intervalMs) {
        return;
      }

      const nextValue = selectorRef.current(state);
      if (Object.is(selectedValueRef.current, nextValue)) {
        return;
      }

      selectedValueRef.current = nextValue;
      lastUpdateRef.current = now;
      setSelectedValue(nextValue);
    });
  }, [intervalMs]);

  return selectedValue;
}
