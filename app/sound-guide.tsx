import { StyleSheet, Text, View } from 'react-native';
import AnalysisGraph from '@/components/AnalysisGraph';
import { RecordButton } from '@/components/RecordButton';
import { useThrottledMicrophoneSpectrumValue } from '@/hooks/useThrottledMicrophoneSpectrumValue';
import { useMicrophoneSpectrumStore } from '@/store/microphoneSpectrumStore';

const DISPLAY_INTERVAL_MS = 300;

export default function SoundGuideScreen() {
  const isRunning = useMicrophoneSpectrumStore(state => state.isRunning);
  const displayDb = useThrottledMicrophoneSpectrumValue(state => state.dbfs, DISPLAY_INTERVAL_MS);

  const dbDisplay = isRunning ? `${displayDb.toFixed(1)} dB` : '— dB';

  return (
    <View style={styles.page}>
      <Text style={styles.dbText}>{dbDisplay}</Text>
      <AnalysisGraph />
      <RecordButton />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
    backgroundColor: '#FEFAEE',
  },
  dbText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
  },
});
