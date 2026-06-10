import { audioVisualValues } from '@/audio/visual/audioVisualValues';
import { CALIBRATION_PEAK_DBFS } from '@/audio/engine';
import { SPECTRUM_BANDS } from '@/audio/spectrum/constants';
import Surface from '@/components/Surface';
import { useGraphSurfaceWidth } from '@/components/graphLayoutDimensions';
import { useTheme } from '@/context/ThemeContext';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

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
  'worklet';
  // Keep the user-facing Calibration Offset out of dB/Freq bars. This baseline
  // shift only maps analyser dBFS values into the existing chart scale; a user
  // Calibration Offset corrects the broadband sound-level reading. Correcting
  // these per-band bars would require Frequency Response Calibration, because
  // microphones differ by frequency and a single SPL offset would misrepresent
  // the spectrum shape.
  return dbfs + CALIBRATION_PEAK_DBFS;
}

function dbToHeight(db: number) {
  'worklet';
  if (db <= MIN_DB) return 0;
  const clampedDb = Math.min(MAX_DB, Math.max(db, MIN_DB));
  return Math.max(2, ((clampedDb - MIN_DB) / DB_RANGE) * INNER_H);
}

export default function FrequencyBarGraph() {
  const surfaceWidth = useGraphSurfaceWidth();
  const chartWidth = Math.max(0, surfaceWidth - Y_AXIS_WIDTH - CONTAINER_HORIZONTAL_PADDING - CONTAINER_RIGHT_PADDING);

  return (
    <Surface style={styles.container}>
      <SpectrumBars chartWidth={chartWidth} />
    </Surface>
  );
}

function SpectrumBars({ chartWidth }: { chartWidth: number }) {
  const { typography, colors } = useTheme();

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

          <Canvas style={[styles.barsCanvas, { width: chartWidth }]}>
            {SPECTRUM_BANDS.map((band, index) => (
              <AnimatedSpectrumBar
                activeColor={colors.moderate}
                chartWidth={chartWidth}
                inactiveColor={colors.inactive}
                key={band.label}
                quietColor={colors.quiet}
                index={index}
              />
            ))}
          </Canvas>
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

function AnimatedSpectrumBar({
  activeColor,
  chartWidth,
  inactiveColor,
  quietColor,
  index,
}: {
  activeColor: string;
  chartWidth: number;
  inactiveColor: string;
  quietColor: string;
  index: number;
}) {
  const bandWidth = Math.max(0, chartWidth - 8) / SPECTRUM_BANDS.length;
  const barWidth = Math.min(10, Math.max(2, bandWidth * 0.5));
  const x = 4 + bandWidth * index + (bandWidth - barWidth) / 2;
  const barHeight = useDerivedValue(() => {
    if (!audioVisualValues.spectrumHasSignal.value) {
      return 0;
    }
    return dbToHeight(calibrate(audioVisualValues.spectrumBars.value[index] ?? -200));
  });
  const peakHeight = useDerivedValue(() => {
    if (!audioVisualValues.spectrumHasSignal.value) {
      return 0;
    }
    return dbToHeight(calibrate(audioVisualValues.spectrumPeaks.value[index] ?? -200));
  });
  const barY = useDerivedValue(() => CHART_HEIGHT - barHeight.value);
  const peakY = useDerivedValue(() => CHART_HEIGHT - peakHeight.value);
  const barColor = useDerivedValue(() => {
    const db = calibrate(audioVisualValues.spectrumBars.value[index] ?? -200);
    return db <= 60 ? quietColor : activeColor;
  });

  return (
    <>
      <RoundedRect color={inactiveColor} height={peakHeight} r={2} width={barWidth} x={x} y={peakY} />
      <RoundedRect color={barColor} height={barHeight} r={2} width={barWidth} x={x} y={barY} />
    </>
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
  barsCanvas: {
    height: CHART_HEIGHT,
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
    fontSize: 10,
    textAlign: 'center',
  },
});
