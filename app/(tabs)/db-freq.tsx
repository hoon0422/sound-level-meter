import FrequencyBarGraph from '@/components/FrequencyBarGraph';
import GraphsLayout from '@/components/GraphTabLayout';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function DbFreqScreen() {
  const { configureSpectrum } = useAudioMeterStore(state => ({
    configureSpectrum: state.configureSpectrum,
  }));

  useFocusEffect(
    useCallback(() => {
      configureSpectrum({ ...DEFAULT_CONFIG, enabled: true });

      return () => {
        configureSpectrum({ ...DEFAULT_CONFIG, enabled: false });
      };
    }, [configureSpectrum])
  );

  return (
    <GraphsLayout>
      <FrequencyBarGraph />
    </GraphsLayout>
  );
}
