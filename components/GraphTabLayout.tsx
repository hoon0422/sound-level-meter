import { RecordButton } from '@/components/RecordButton';
import { SoundMeter } from '@/components/SoundMeter';
import { RocketGamePage } from '@/components/RocketGamePage';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
};

export default function GraphsLayout({ children }: Props) {
  const { colors } = useTheme();
  const elapsedSeconds = useAudioMeterStore(state => state.elapsedSeconds);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={styles.graphContainer}>
        <SoundMeter />
        {children}
        <View style={styles.recordingControlContainer}>
          <Text style={[styles.elapsedTimeText, { color: colors.text }]}>{secondsToTime(elapsedSeconds)}</Text>
          <RecordButton />
        </View>
      </View>
      <View style={styles.rocketPlaceholder}>
        <RocketGamePage />
      </View>
    </View>
  );
}

const secondsToTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${mins}:${secs}`;
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flex: 1,
    gap: 10,
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 24,
  },
  graphContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  recordingControlContainer: {
    flex: 1,
    width: '100%',
    minHeight: 'auto',
    paddingVertical: 8,
    alignItems: 'center',
    gap: 15,
    justifyContent: 'center',
  },
  elapsedTimeText: {
    fontFamily: 'DM Sans',
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'right',
  },
  rocketPlaceholder: {
    width: 24,
    height: '100%',
  },
});
