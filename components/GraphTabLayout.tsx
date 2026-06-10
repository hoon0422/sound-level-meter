import { useAdAccess } from '@/context/AdAccessContext';
import { RecordButton } from '@/components/RecordButton';
import { SoundMeter } from '@/components/SoundMeter';
import { RocketGamePage } from '@/components/RocketGamePage';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import {
  GRAPH_LAYOUT_COLUMN_GAP,
  GRAPH_LAYOUT_PADDING_LEFT,
  GRAPH_LAYOUT_PADDING_RIGHT,
  GRAPH_LAYOUT_ROCKET_WIDTH,
} from './graphLayoutDimensions';

type Props = {
  children: React.ReactNode;
};

export default function GraphsLayout({ children }: Props) {
  const { colors } = useTheme();
  const soundMeter = useMemo(() => <SoundMeter />, []);
  const rocketGame = useMemo(() => <RocketGamePage />, []);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <LongMeasurementAccessGuard />
      <View style={styles.graphContainer}>
        {soundMeter}
        {children}
        <View style={styles.recordingControlContainer}>
          <ElapsedTimeText />
          <RecordButton />
        </View>
      </View>
      <View style={styles.rocketPlaceholder}>{rocketGame}</View>
    </View>
  );
}

const LongMeasurementAccessGuard = memo(function LongMeasurementAccessGuard() {
  const { ensureAccess, hasAccess } = useAdAccess();
  const { elapsedTimeSeconds, isRunning, stop } = useAudioMeterStore(state => ({
    elapsedTimeSeconds: Math.floor(state.elapsedSeconds),
    isRunning: state.isRunning,
    stop: state.stop,
  }));
  const didPromptForLongMeasurementRef = useRef(false);

  useEffect(() => {
    if (!isRunning) {
      didPromptForLongMeasurementRef.current = false;
      return;
    }

    if (hasAccess) {
      return;
    }

    if (elapsedTimeSeconds >= 30 && !didPromptForLongMeasurementRef.current) {
      didPromptForLongMeasurementRef.current = true;
      stop();
      ensureAccess('measurement');
    }
  }, [elapsedTimeSeconds, ensureAccess, hasAccess, isRunning, stop]);

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
