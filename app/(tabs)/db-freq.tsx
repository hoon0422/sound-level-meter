import FrequencyBarGraph from '@/components/FrequencyBarGraph';
import GraphsLayout from '@/components/GraphTabLayout';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

export default function DbFreqScreen() {
  const isFocused = useIsFocused();
  const { configureSpectrum, isRunning } = useAudioMeterStore(state => ({
    configureSpectrum: state.configureSpectrum,
    isRunning: state.isRunning,
  }));

  useFocusEffect(
    useCallback(() => {
      configureSpectrum({ ...DEFAULT_CONFIG, enabled: true });

      return () => {
        configureSpectrum({ ...DEFAULT_CONFIG, enabled: false });
      };
    }, [configureSpectrum])
  );

  useEffect(() => {
    if (isFocused) {
      configureSpectrum({ ...DEFAULT_CONFIG, enabled: true });
    }
  }, [configureSpectrum, isFocused, isRunning]);

  return (
    <GraphsLayout>
      <FrequencyBarGraph />
    </GraphsLayout>
  );
}
