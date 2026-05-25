import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';
import { SPECTRUM_BANDS } from '@/audio/spectrum';
import { useTheme } from '@/context/ThemeContext';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { StyleSheet, Text, View } from 'react-native';
import Surface from './Surface';

const CONTAINER_HEIGHT = 180;
const CONTAINER_VERTICAL_PADDING = 8;
const CONTAINER_HORIZONTAL_PADDING = 8;
const CONTAINER_RIGHT_PADDING = 24;
const FREQ_LABEL_HEIGHT = 14;
const SPECTRUM_GAP = 4;
const BAR_HEIGHT = CONTAINER_HEIGHT - CONTAINER_VERTICAL_PADDING * 2 - FREQ_LABEL_HEIGHT - SPECTRUM_GAP;
const MIN_DB = 0;
const MAX_DB = 140;
const DB_RANGE = MAX_DB - MIN_DB;
const DB_GRID_LINES = [20, 40, 60, 80, 100, 120];

function dbToY(db: number) {
  return ((db - MIN_DB) / DB_RANGE) * BAR_HEIGHT;
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
  return Math.max(2, ((Math.max(db, MIN_DB) - MIN_DB) / DB_RANGE) * BAR_HEIGHT);
}

function meterColorDb(db: number, colors: ReturnType<typeof useTheme>['colors']) {
  if (db < 40) return colors.quiet;
  if (db < 70) return colors.moderate;
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
  const { colors } = useTheme();
  const { bars, barPeaks, hasSignal } = useAudioMeterStore(state => ({
    bars: state.bars,
    barPeaks: state.maximumBars,
    hasSignal: state.elapsedSeconds > 0 && state.dbfs > 0,
  }));

  return (
    <View style={styles.spectrumContainer}>
      <View style={styles.spectrumChart}>
        <View style={styles.dbAxis}>
          <Text style={styles.dbAxisTitle}>dB</Text>
          {DB_GRID_LINES.map(db => (
            <Text key={db} style={[styles.dbLabel, { bottom: dbToY(db) - 6, color: colors.inactive }]}>
              {db}
            </Text>
          ))}
        </View>

        <View style={[styles.chartArea, { borderColor: colors.divider }]}>
          {DB_GRID_LINES.map(db => (
            <View key={db} style={[styles.gridLine, { backgroundColor: colors.divider, bottom: dbToY(db) }]} />
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
      </View>

      <View style={styles.freqLabelsRow}>
        <View style={styles.dbAxisSpacer} />
        <View style={styles.freqLabelsInner}>
          {SPECTRUM_BANDS.map(band => (
            <Text key={band.label} style={[styles.freqLabel, { color: colors.inactive }]}>
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
    width: 320,
  },
  spectrumContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPECTRUM_GAP,
  },
  spectrumChart: {
    flexDirection: 'row',
    width: '100%',
  },
  dbAxis: {
    width: 30,
    height: BAR_HEIGHT,
    position: 'relative',
  },
  dbAxisTitle: {
    position: 'absolute',
    right: 4,
    top: 0,
    fontSize: 9,
    color: '#999',
  },
  dbAxisSpacer: {
    width: 30,
  },
  dbLabel: {
    position: 'absolute',
    right: 4,
    fontSize: 9,
  },
  chartArea: {
    flex: 1,
    height: BAR_HEIGHT,
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
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 4,
  },
  barContainer: {
    position: 'relative',
    flex: 1,
    height: BAR_HEIGHT,
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
    justifyContent: 'center',
    width: '100%',
    height: FREQ_LABEL_HEIGHT,
  },
  freqLabelsInner: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  freqLabel: {
    flex: 1,
    fontSize: 9,
    textAlign: 'center',
  },
});
