import { Image, StyleSheet, Text, View } from 'react-native';
import AnalysisGraph from '@/components/AnalysisGraph';
import { RecordButton } from '@/components/RecordButton';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { useTheme } from '@/context/ThemeContext';

const DISPLAY_INTERVAL_MS = 300;

export default function SoundGuideScreen() {
  const { colors } = useTheme();
  const isRunning = useAudioMeterStore(state => state.isRunning);
  const displayDb = useThrottledAudioMeterValue(state => state.dbfs, DISPLAY_INTERVAL_MS);

  const dbDisplay = isRunning ? `${displayDb.toFixed(1)} dB` : '— dB';

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Text style={[styles.dbText, { color: colors.text }]}>{dbDisplay}</Text>
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
  },
  dbText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
  },
});
