import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';
import { SPECTRUM_BANDS } from '@/audio/spectrum';
import { useTheme } from '@/context/ThemeContext';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { StyleSheet, Text, View } from 'react-native';
import Surface from './Surface';

const BAR_HEIGHT = 120;
const MIN_DB = 0;
const MAX_DB = 140;
const DB_RANGE = MAX_DB - MIN_DB;
const DB_GRID_LINES = [20, 40, 60, 80, 100, 120];

function dbToY(db: number) {
  return ((db - MIN_DB) / DB_RANGE) * BAR_HEIGHT;
}

function calibrate(dbfs: number) {
  return dbfs + CALIBRATION_PEAK_DBFS;
}

function dbToHeight(db: number) {
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
  const { bars, barPeaks } = useAudioMeterStore(state => ({
    bars: state.bars,
    barPeaks: state.maximumBars,
  }));

  return (
    <View style={styles.spectrumContainer}>
      <View style={styles.spectrumChart}>
        <View style={styles.dbAxis}>
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
              return (
                <View style={styles.barContainer} key={SPECTRUM_BANDS[index]?.label ?? String(index)}>
                  <View
                    style={[
                      styles.bar,
                      styles.barPeak,
                      {
                        top: -dbToHeight(peakDb),
                        height: dbToHeight(peakDb),
                        backgroundColor: colors.inactive,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        top: -dbToHeight(db),
                        height: dbToHeight(db),
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
    padding: 8,
    width: 320,
  },
  spectrumContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
  },
  bar: {
    ...StyleSheet.absoluteFillObject,
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
