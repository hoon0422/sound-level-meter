import { SpectrumBars } from '@/components/SpectrumBars';
import { StatsPanel } from '@/components/StatsPanel';
import { useSoundLevelMeter } from '@/hooks/useSoundLevelMeter';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const { bars, buttonTitle, dbfs, elapsedSeconds, error, isBusy, isRunning, isStarting, peakHz, toggleRecording } =
    useSoundLevelMeter();

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        {isRunning ? (
          <View style={styles.content}>
            <StatsPanel elapsedSeconds={elapsedSeconds} dbfs={dbfs} peakHz={peakHz} error={error} />
            <SpectrumBars bars={bars} />
          </View>
        ) : (
          <Text style={styles.statsText}>{isStarting ? 'Starting...' : 'Press record'}</Text>
        )}
        <Button title={buttonTitle} disabled={isBusy} onPress={toggleRecording} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: 40,
    paddingInline: 20,
    backgroundColor: '#FEFAEE',
  },
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'red',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 30,
  },
});
