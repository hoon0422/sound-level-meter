import { RecordButton } from '@/components/RecordButton';
import { SpectrumBars } from '@/components/SpectrumBars';
import { StatsPanel } from '@/components/StatsPanel';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function DbFreqScreen() {
  const { colors } = useTheme();
  const { dbfs, peakHz } = useThrottledAudioMeterValue(state => ({
    dbfs: state.dbfs,
    peakHz: state.peakHz,
  }));
  const { bars, elapsedSeconds, error, isRunning } = useAudioMeterStore(state => ({
    elapsedSeconds: state.elapsedSeconds,
    error: state.error,
    isRunning: state.isRunning,
    bars: state.bars,
  }));

  const dbDisplay = isRunning ? `${dbfs.toFixed(1)} dB` : '— dB';

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Text style={[styles.dbText, { color: colors.text }]}>{dbDisplay}</Text>
      <View>
        <StatsPanel elapsedSeconds={elapsedSeconds} dbfs={dbfs} peakHz={peakHz} error={error} />
        <SpectrumBars bars={bars} />
      </View>

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
