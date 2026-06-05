import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';
import { SPECTRUM_BANDS } from '@/audio/spectrum';
import Surface from '@/components/Surface';
import { useTheme } from '@/context/ThemeContext';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Canvas, Circle, RoundedRect } from '@shopify/react-native-skia';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CONTAINER_HEIGHT = 180;
const CONTAINER_VERTICAL_PADDING = 8;
const CONTAINER_HORIZONTAL_PADDING = 8;
const CONTAINER_RIGHT_PADDING = 24;
const CONTAINER_WIDTH = 320;
const INNER_H = 110;
const CHART_TOP_INSET = 10;
const CHART_HEIGHT = INNER_H + CHART_TOP_INSET;
const X_AXIS_H = 20;
const Y_AXIS_WIDTH = 28;
const CHART_WIDTH = CONTAINER_WIDTH - Y_AXIS_WIDTH - CONTAINER_HORIZONTAL_PADDING - CONTAINER_RIGHT_PADDING;
const TRACK_WIDTH = 8;
const TRACK_GAP = 14;
const TRACK_TOP = CHART_TOP_INSET;
const TRACK_HEIGHT = CHART_HEIGHT - TRACK_TOP;
const TRACK_BOTTOM = TRACK_TOP + TRACK_HEIGHT;
const MIN_TRACK_HEIGHT = 2;
const THUMB_OUTER_RADIUS = 10;
const THUMB_INNER_RADIUS = 7;
const TRACK_COLOR = '#FDBD22';

const MIN_DB = 0;
const MAX_DB = 120;
const DB_RANGE = MAX_DB - MIN_DB;
const DB_LABELS = [120, 100, 80, 60, 40, 20, 0];
const DB_GRID_LINES = [40, 80, 120];

function dbToTop(db: number) {
  return CHART_TOP_INSET + ((MAX_DB - db) / DB_RANGE) * INNER_H;
}

function dbToY(db: number) {
  const clampedDb = Math.min(MAX_DB, Math.max(db, MIN_DB));
  return TRACK_BOTTOM - ((clampedDb - MIN_DB) / DB_RANGE) * TRACK_HEIGHT;
}

function calibrate(dbfs: number) {
  // Keep the user-facing Calibration Offset out of dB/Freq bars. This baseline
  // shift only maps analyser dBFS values into the existing chart scale; a user
  // Calibration Offset corrects the broadband sound-level reading. Correcting
  // these per-band bars would require Frequency Response Calibration, because
  // microphones differ by frequency and a single SPL offset would misrepresent
  // the spectrum shape.
  return dbfs + CALIBRATION_PEAK_DBFS;
}

function trackX(index: number) {
  const totalTrackWidth = SPECTRUM_BANDS.length * TRACK_WIDTH + (SPECTRUM_BANDS.length - 1) * TRACK_GAP;
  const startX = Math.max(THUMB_OUTER_RADIUS, (CHART_WIDTH - totalTrackWidth) / 2);
  return startX + index * (TRACK_WIDTH + TRACK_GAP) + TRACK_WIDTH / 2;
}

export default function FrequencyBarGraph() {
  return (
    <Surface style={styles.container}>
      <SpectrumBars />
    </Surface>
  );
}

function SpectrumBars() {
  const { typography, colors } = useTheme();
  const { bars, barPeaks, hasSignal } = useAudioMeterStore(state => ({
    bars: state.bars,
    barPeaks: state.maximumBars,
    hasSignal: state.elapsedSeconds > 0 && state.dbfs > 0,
  }));

  return (
    <View style={styles.graphRow}>
      <View style={styles.yAxisLabels}>
        <Text
          style={[styles.yLabelText, { top: dbToTop(145), color: colors.inactive, fontFamily: typography.fontFamily }]}
        >
          dB
        </Text>
        {DB_LABELS.map(db => (
          <Text
            key={db}
            style={[
              styles.yLabelText,
              { top: dbToTop(db) - 6, color: colors.inactive, fontFamily: typography.fontFamily },
            ]}
          >
            {db}
          </Text>
        ))}
      </View>

      <View style={styles.chartColumn}>
        <View style={styles.chartArea}>
          <View style={[styles.yAxisLine, { backgroundColor: colors.inactive }]} />
          {DB_GRID_LINES.map(db => (
            <View key={db} style={[styles.gridLine, { backgroundColor: colors.inactive, top: dbToTop(db) }]} />
          ))}

          <Canvas style={styles.canvas}>
            {SPECTRUM_BANDS.map((band, index) => {
              const x = trackX(index);
              const y = dbToY(hasSignal ? calibrate(bars[index] ?? MIN_DB) : MIN_DB);
              const peakY = dbToY(hasSignal ? calibrate(barPeaks[index] ?? MIN_DB) : MIN_DB);
              const trackY = Math.min(peakY, TRACK_BOTTOM - MIN_TRACK_HEIGHT);
              const trackHeight = TRACK_BOTTOM - trackY;

              return (
                <Fragment key={band.label}>
                  <RoundedRect
                    x={x - TRACK_WIDTH / 2}
                    y={trackY}
                    width={TRACK_WIDTH}
                    height={trackHeight}
                    r={TRACK_WIDTH / 2}
                    color={TRACK_COLOR}
                  />
                  <Circle cx={x} cy={y} r={THUMB_OUTER_RADIUS} color={TRACK_COLOR} />
                  <Circle cx={x} cy={y} r={THUMB_INNER_RADIUS} color={colors.primary} />
                </Fragment>
              );
            })}
          </Canvas>
          <View style={[styles.xAxisLine, { backgroundColor: colors.inactive }]} />
        </View>

        <View style={styles.freqLabelsRow}>
          {SPECTRUM_BANDS.map(band => (
            <Text
              key={band.label}
              style={[styles.freqLabel, { color: colors.inactive, fontFamily: typography.fontFamily }]}
            >
              {band.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    paddingVertical: CONTAINER_VERTICAL_PADDING,
    paddingLeft: CONTAINER_HORIZONTAL_PADDING,
    paddingRight: CONTAINER_RIGHT_PADDING,
    width: CONTAINER_WIDTH,
  },
  graphRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  yAxisLabels: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    position: 'relative',
  },
  yLabelText: {
    position: 'absolute',
    right: 10,
    fontSize: 10,
    textAlign: 'right',
  },
  chartColumn: {
    flex: 1,
  },
  chartArea: {
    height: CHART_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  yAxisLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: CHART_HEIGHT,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  canvas: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  },
  xAxisLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  freqLabelsRow: {
    flexDirection: 'row',
    width: '100%',
    height: X_AXIS_H,
    paddingHorizontal: 4,
  },
  freqLabel: {
    flex: 1,
    top: 4,
    fontSize: 9,
    textAlign: 'center',
  },
});
