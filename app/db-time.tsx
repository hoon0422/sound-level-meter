import { RecordButton } from '@/components/RecordButton';
import SoundGraph from '@/components/SoundGraph';
import { View } from 'react-native';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { StyleSheet, Text } from 'react-native';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { useTheme } from '@/context/ThemeContext';

export default function DbTimeScreen() {
  const { colors } = useTheme();
  const { dbfs } = useThrottledAudioMeterValue(state => ({
      dbfs: state.dbfs,
      peakHz: state.peakHz,
    }));

  const { isRunning } = useAudioMeterStore(state => ({
      elapsedSeconds: state.elapsedSeconds,
      error: state.error,
      isRunning: state.isRunning,
      bars: state.bars,
    }));

  const dbDisplay = isRunning ? `${dbfs.toFixed(1)} dB` : '— dB';

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Text style={[styles.dbText, { color: colors.text }]}>{dbDisplay}</Text>
      <SoundGraph />
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
  },
});
