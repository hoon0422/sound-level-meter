import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';
import { SPECTRUM_BANDS } from '@/audio/spectrum';
import Surface from '@/components/Surface';
import { useTheme } from '@/context/ThemeContext';
import { useAudioMeterStore } from '@/store/audioMeterStore';
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

const MIN_DB = 0;
const MAX_DB = 120;
const DB_RANGE = MAX_DB - MIN_DB;
const DB_LABELS = [120, 100, 80, 60, 40, 20, 0];
const DB_GRID_LINES = [40, 80, 120];

function dbToTop(db: number) {
  return CHART_TOP_INSET + ((MAX_DB - db) / DB_RANGE) * INNER_H;
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

function dbToHeight(db: number) {
  if (db <= MIN_DB) return 0;
  const clampedDb = Math.min(MAX_DB, Math.max(db, MIN_DB));
  return Math.max(2, ((clampedDb - MIN_DB) / DB_RANGE) * INNER_H);
}

function meterColorDb(db: number, colors: ReturnType<typeof useTheme>['colors']) {
  if (db < 40) return colors.quiet;
  if (db < 80) return colors.moderate;
  return colors.loud;
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
        <View style={[styles.chartArea, { borderColor: colors.inactive }]}>
          {DB_GRID_LINES.map(db => (
            <View key={db} style={[styles.gridLine, { backgroundColor: colors.inactive, top: dbToTop(db) }]} />
          ))}

          <View style={styles.barsRow}>
            {bars.map((rawDbfs, index) => {
              const db = calibrate(rawDbfs);
              const peakDb = calibrate(barPeaks[index]);
              const barHeight = hasSignal ? dbToHeight(db) : 0;
              const peakHeight = hasSignal ? dbToHeight(peakDb) : 0;
              return (
                <View style={styles.barContainer} key={SPECTRUM_BANDS[index]?.label ?? String(index)}>
                  <View
                    style={[
                      styles.bar,
                      styles.barPeak,
                      {
                        height: peakHeight,
                        backgroundColor: colors.inactive,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: meterColorDb(db, colors),
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
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
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  barsRow: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 4,
  },
  barContainer: {
    position: 'relative',
    flex: 1,
    height: CHART_HEIGHT,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 2,
    width: 10,
    left: '50%',
    transform: [{ translateX: -5 }],
  },
  barPeak: {},
  freqLabelsRow: {
    flexDirection: 'row',
    width: '100%',
    height: X_AXIS_H,
    paddingHorizontal: 4,
  },
  freqLabel: {
    flex: 1,
    top: 4,
    fontSize: 10,
    textAlign: 'center',
  },
});
