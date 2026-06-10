import { DB_TIME_GRAPH_DB_MAX, DB_TIME_GRAPH_DB_MIN, type DbTimeGraphSample } from '@/audio/dbTimeGraph';
import Surface from '@/components/Surface';
import { useTheme } from '@/context/ThemeContext';
import { getDbTimeGraphSamples, useAudioMeterStore } from '@/store/audioMeterStore';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
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

const Y_LABELS = [120, 100, 80, 60, 40, 20, 0];
const GRID_DBS = [40, 80, 120];
const X_LABEL_COUNT = 6;
const ACTIVE_COLOR = '#3bbfce';
const CHART_RIGHT_INSET = 10;

type ChartPoint = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dbToY(db: number) {
  const clampedDb = clamp(db, DB_TIME_GRAPH_DB_MIN, DB_TIME_GRAPH_DB_MAX);
  return (
    CHART_TOP_INSET +
    INNER_H -
    ((clampedDb - DB_TIME_GRAPH_DB_MIN) / (DB_TIME_GRAPH_DB_MAX - DB_TIME_GRAPH_DB_MIN)) * INNER_H
  );
}

function dbToTop(db: number) {
  return CHART_TOP_INSET + ((DB_TIME_GRAPH_DB_MAX - db) / (DB_TIME_GRAPH_DB_MAX - DB_TIME_GRAPH_DB_MIN)) * INNER_H;
}

function formatElapsedLabel(seconds: number) {
  return `${Math.round(seconds)}`;
}

function toChartPoint(sample: DbTimeGraphSample, windowStartSeconds: number, windowEndSeconds: number): ChartPoint {
  const durationSeconds = Math.max(windowEndSeconds - windowStartSeconds, 1);
  return {
    x: ((sample.sessionElapsedSeconds - windowStartSeconds) / durationSeconds) * (CHART_WIDTH - CHART_RIGHT_INSET),
    y: dbToY(sample.db),
  };
}

export default function SoundGraph() {
  const { typography, colors } = useTheme();
  const { graphVersion, isRunning, windowStartSeconds, windowEndSeconds } = useAudioMeterStore(state => ({
    graphVersion: state.dbTimeGraphVersion,
    isRunning: state.dbTimeGraphIsRunning,
    windowStartSeconds: state.dbTimeGraphWindowStartSeconds,
    windowEndSeconds: state.dbTimeGraphWindowEndSeconds,
  }));

  const chart = useMemo(() => {
    const samples = getDbTimeGraphSamples(graphVersion);
    const path = Skia.Path.Make();
    let chartStartSeconds = windowStartSeconds;
    let currentPoint: ChartPoint | null = null;
    let hasPoint = false;

    if (windowStartSeconds === 0) {
      const firstDrawableSample = samples.find(
        sample =>
          !sample.isInitial &&
          sample.sessionElapsedSeconds >= windowStartSeconds &&
          sample.sessionElapsedSeconds <= windowEndSeconds
      );
      chartStartSeconds = firstDrawableSample?.sessionElapsedSeconds ?? windowStartSeconds;
    }

    for (const sample of samples) {
      if (
        sample.isInitial ||
        sample.sessionElapsedSeconds < windowStartSeconds ||
        sample.sessionElapsedSeconds > windowEndSeconds
      ) {
        continue;
      }

      const point = toChartPoint(sample, chartStartSeconds, windowEndSeconds);
      if (!hasPoint) {
        path.moveTo(point.x, point.y);
        hasPoint = true;
      } else {
        path.lineTo(point.x, point.y);
      }
      currentPoint = point;
    }

    return {
      path,
      currentPoint,
    };
  }, [graphVersion, windowEndSeconds, windowStartSeconds]);

  const xLabels = useMemo(() => {
    const durationSeconds = windowEndSeconds - windowStartSeconds;
    return Array.from({ length: X_LABEL_COUNT }, (_, index) => {
      const ratio = index / (X_LABEL_COUNT - 1);
      return {
        key: `${windowStartSeconds}-${windowEndSeconds}-${index}`,
        left: ratio * CHART_WIDTH,
        label: formatElapsedLabel(windowStartSeconds + durationSeconds * ratio),
      };
    });
  }, [windowEndSeconds, windowStartSeconds]);

  return (
    <Surface style={styles.container}>
      <View style={styles.graphRow}>
        <View style={styles.yAxisLabels}>
          <Text
            style={[
              styles.yLabelText,
              { top: dbToTop(145), color: colors.inactive, fontFamily: typography.fontFamily },
            ]}
          >
            dB
          </Text>
          {Y_LABELS.map(db => (
            <Text
              key={`y-${db}`}
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
          <View style={[styles.yAxisLine, { backgroundColor: colors.inactive }]} />
          <View style={styles.chartClip}>
            {GRID_DBS.map(db => (
              <View
                key={`grid-${db}`}
                style={[styles.gridLine, { backgroundColor: colors.inactive, top: dbToY(db) }]}
              />
            ))}
            <Canvas style={styles.canvas}>
              <Path path={chart.path} color={ACTIVE_COLOR} style="stroke" strokeWidth={2} />
              {chart.currentPoint && (
                <Circle
                  cx={chart.currentPoint.x}
                  cy={chart.currentPoint.y}
                  r={3}
                  color={isRunning ? ACTIVE_COLOR : colors.inactive}
                />
              )}
            </Canvas>
            <View style={[styles.xAxisLine, { backgroundColor: colors.inactive }]} />
          </View>

          <View style={styles.xLabels}>
            {xLabels.map(({ key, label, left }, index) => (
              <Text
                key={key}
                style={[
                  styles.xLabel,
                  {
                    left,
                    color: colors.inactive,
                    fontFamily: typography.fontFamily,
                    transform: [{ translateX: index === 0 ? 0 : index === X_LABEL_COUNT - 1 ? -10 : -5 }],
                  },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </Surface>
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
  yAxisLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: CHART_HEIGHT,
  },
  chartClip: {
    height: CHART_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
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
  xLabels: {
    height: X_AXIS_H,
    position: 'relative',
  },
  xLabel: {
    position: 'absolute',
    top: 4,
    fontSize: 10,
  },
});
