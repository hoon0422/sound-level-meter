import { RecordButton } from '@/components/RecordButton';
import { SpectrumBars } from '@/components/SpectrumBars';
import { StatsPanel } from '@/components/StatsPanel';
import { useThrottledMicrophoneSpectrumValue } from '@/hooks/useThrottledMicrophoneSpectrumValue';
import { useMicrophoneSpectrumStore } from '@/store/microphoneSpectrumStore';
import { StyleSheet, Text, View } from 'react-native';

export default function DbFreqScreen() {
  const { dbfs, peakHz } = useThrottledMicrophoneSpectrumValue(state => ({
    dbfs: state.dbfs,
    peakHz: state.peakHz,
  }));
  const { bars, elapsedSeconds, error, isRunning } = useMicrophoneSpectrumStore(state => ({
    elapsedSeconds: state.elapsedSeconds,
    error: state.error,
    isRunning: state.isRunning,
    bars: state.bars,
  }));

  const dbDisplay = isRunning ? `${dbfs.toFixed(1)} dB` : '— dB';

  return (
    <View style={styles.page}>
      <Text style={styles.dbText}>{dbDisplay}</Text>
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
    backgroundColor: '#FEFAEE',
  },
  dbText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
  },
});
