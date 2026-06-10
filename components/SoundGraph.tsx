import {
  DB_TIME_GRAPH_CHART_HEIGHT,
  DB_TIME_GRAPH_CHART_WIDTH,
  DB_TIME_GRAPH_CONTAINER_HEIGHT,
  DB_TIME_GRAPH_CONTAINER_HORIZONTAL_PADDING,
  DB_TIME_GRAPH_CONTAINER_RIGHT_PADDING,
  DB_TIME_GRAPH_CONTAINER_VERTICAL_PADDING,
  DB_TIME_GRAPH_CONTAINER_WIDTH,
  DB_TIME_GRAPH_X_AXIS_HEIGHT,
  DB_TIME_GRAPH_Y_AXIS_WIDTH,
  dbTimeGraphDbToTop,
  dbTimeGraphDbToY,
} from '@/audio/dbTimeGraph';
import Surface from '@/components/Surface';
import { useTheme } from '@/context/ThemeContext';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Y_LABELS = [120, 100, 80, 60, 40, 20, 0];
const GRID_DBS = [40, 80, 120];
const X_LABEL_COUNT = 6;
const ACTIVE_COLOR = '#3bbfce';

function formatElapsedLabel(seconds: number) {
  return `${Math.round(seconds)}`;
}

function SoundGraph() {
  const { typography, colors } = useTheme();
  const { graphPath, currentPoint, isRunning, windowStartSeconds, windowEndSeconds } = useAudioMeterStore(state => ({
    graphPath: state.dbTimeGraphPath,
    currentPoint: state.dbTimeGraphCurrentPoint,
    isRunning: state.dbTimeGraphIsRunning,
    windowStartSeconds: state.dbTimeGraphWindowStartSeconds,
    windowEndSeconds: state.dbTimeGraphWindowEndSeconds,
  }));

  const xLabels = useMemo(() => {
    const durationSeconds = windowEndSeconds - windowStartSeconds;
    return Array.from({ length: X_LABEL_COUNT }, (_, index) => {
      const ratio = index / (X_LABEL_COUNT - 1);
      return {
        key: `${windowStartSeconds}-${windowEndSeconds}-${index}`,
        left: ratio * DB_TIME_GRAPH_CHART_WIDTH,
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
              { top: dbTimeGraphDbToTop(145), color: colors.inactive, fontFamily: typography.fontFamily },
            ]}
          >
            dB
          </Text>
          {Y_LABELS.map(db => (
            <Text
              key={`y-${db}`}
              style={[
                styles.yLabelText,
                { top: dbTimeGraphDbToTop(db) - 6, color: colors.inactive, fontFamily: typography.fontFamily },
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
                style={[styles.gridLine, { backgroundColor: colors.inactive, top: dbTimeGraphDbToY(db) }]}
              />
            ))}
            <Canvas style={styles.canvas}>
              {graphPath.length > 0 && <Path path={graphPath} color={ACTIVE_COLOR} style="stroke" strokeWidth={2} />}
              {currentPoint && (
                <Circle
                  cx={currentPoint.x}
                  cy={currentPoint.y}
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

export default memo(SoundGraph);

const styles = StyleSheet.create({
  container: {
    height: DB_TIME_GRAPH_CONTAINER_HEIGHT,
    paddingVertical: DB_TIME_GRAPH_CONTAINER_VERTICAL_PADDING,
    paddingLeft: DB_TIME_GRAPH_CONTAINER_HORIZONTAL_PADDING,
    paddingRight: DB_TIME_GRAPH_CONTAINER_RIGHT_PADDING,
    width: DB_TIME_GRAPH_CONTAINER_WIDTH,
  },
  graphRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  yAxisLabels: {
    width: DB_TIME_GRAPH_Y_AXIS_WIDTH,
    height: DB_TIME_GRAPH_CHART_HEIGHT,
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
    height: DB_TIME_GRAPH_CHART_HEIGHT,
  },
  chartClip: {
    height: DB_TIME_GRAPH_CHART_HEIGHT,
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
    width: DB_TIME_GRAPH_CHART_WIDTH,
    height: DB_TIME_GRAPH_CHART_HEIGHT,
  },
  xAxisLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  xLabels: {
    height: DB_TIME_GRAPH_X_AXIS_HEIGHT,
    position: 'relative',
  },
  xLabel: {
    position: 'absolute',
    top: 4,
    fontSize: 10,
  },
});
