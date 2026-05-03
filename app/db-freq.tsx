import { StyleSheet, Text, View } from 'react-native';
import { RecordButton } from '@/components/RecordButton';
import { SpectrumBars } from '@/components/SpectrumBars';
import { StatsPanel } from '@/components/StatsPanel';
import { useMicrophoneSpectrumStore } from '@/store/microphoneSpectrumStore';

export default function DbFreqScreen() {
  const { bars, dbfs, elapsedSeconds, error, isRunning, peakHz } = useMicrophoneSpectrumStore(state => ({
    bars: state.bars,
    dbfs: state.dbfs,
    elapsedSeconds: state.elapsedSeconds,
    error: state.error,
    isRunning: state.isRunning,
    peakHz: state.peakHz,
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
