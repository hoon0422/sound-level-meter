import { RecordButton } from '@/components/RecordButton';
import { RocketGamePage } from '@/components/RocketGamePage';
import { SoundMeter } from '@/components/SoundMeter';
import { useAdAccess } from '@/context/AdAccessContext';
import { useTheme } from '@/context/ThemeContext';
import { audioMeterStore, useAudioMeterStore } from '@/store/audioMeterStore';
import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GRAPH_LAYOUT_COLUMN_GAP,
  GRAPH_LAYOUT_PADDING_LEFT,
  GRAPH_LAYOUT_PADDING_RIGHT,
  GRAPH_LAYOUT_ROCKET_WIDTH,
} from './graphLayoutDimensions';

type Props = {
  children: React.ReactNode;
};

const LONG_MEASUREMENT_LIMIT_SECONDS = 30;

export default function GraphsLayout({ children }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <LongMeasurementAccessGuard />
      <View style={styles.graphContainer}>
        <SoundMeter />
        {children}
        <View style={styles.recordingControlContainer}>
          <ElapsedTimeText />
          <RecordButton />
        </View>
      </View>
      <View style={styles.rocketPlaceholder}>
        <RocketGamePage />
      </View>
    </View>
  );
}

const LongMeasurementAccessGuard = memo(function LongMeasurementAccessGuard() {
  const { ensureAccess, hasAccess } = useAdAccess();
  const didPromptForLongMeasurementRef = useRef(false);

  useEffect(() => {
    const checkLongMeasurementAccess = () => {
      const state = audioMeterStore.getState();

      if (!state.isRunning) {
        didPromptForLongMeasurementRef.current = false;
        return;
      }

      if (hasAccess || didPromptForLongMeasurementRef.current) {
        return;
      }

      if (Math.floor(state.elapsedSeconds) < LONG_MEASUREMENT_LIMIT_SECONDS) {
        return;
      }

      didPromptForLongMeasurementRef.current = true;
      state.stop();
      ensureAccess('measurement');
    };

    checkLongMeasurementAccess();
    return audioMeterStore.subscribe(checkLongMeasurementAccess);
  }, [ensureAccess, hasAccess]);

  return null;
});

const ElapsedTimeText = memo(function ElapsedTimeText() {
  const { colors } = useTheme();
  const elapsedTimeSeconds = useAudioMeterStore(state => Math.floor(state.elapsedSeconds));

  return <Text style={[styles.elapsedTimeText, { color: colors.text }]}>{secondsToTime(elapsedTimeSeconds)}</Text>;
});

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
    gap: GRAPH_LAYOUT_COLUMN_GAP,
    paddingLeft: GRAPH_LAYOUT_PADDING_LEFT,
    paddingRight: GRAPH_LAYOUT_PADDING_RIGHT,
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
    width: GRAPH_LAYOUT_ROCKET_WIDTH,
    height: '100%',
  },
});
