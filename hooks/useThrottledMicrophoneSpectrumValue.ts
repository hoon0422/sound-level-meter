import { microphoneSpectrumStore, type MicrophoneSpectrumState } from '@/store/microphoneSpectrumStore';
import { useEffect, useRef, useState } from 'react';

export function useThrottledMicrophoneSpectrumValue<T>(
  selector: (state: MicrophoneSpectrumState) => T,
  intervalMs: number = 300
) {
  const selectorRef = useRef(selector);
  const lastUpdateRef = useRef(0);
  const selectedValueRef = useRef(selector(microphoneSpectrumStore.getState()));
  const [selectedValue, setSelectedValue] = useState(selectedValueRef.current);

  selectorRef.current = selector;

  useEffect(() => {
    return microphoneSpectrumStore.subscribe(state => {
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
