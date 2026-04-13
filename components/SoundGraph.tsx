import React from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import useAudioStore from '../store/audioStore';

const MAX_POINTS = 600; // 10min × 60s × ~1 samples/sec

const GRAPH_WIDTH = Dimensions.get('window').width - 48;
const GRAPH_HEIGHT = 200;
const PADDING = { top: 15, bottom: 25, left: 20, right: 25 };

const INNER_W = GRAPH_WIDTH - PADDING.left - PADDING.right;
const INNER_H = GRAPH_HEIGHT - PADDING.top - PADDING.bottom;

const DB_MIN = 0;
const DB_MAX = 100;
const Y_LABELS = [0, 25, 50, 75, 100];
const X_LABELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SoundGraph() {
  const { isRecording, samples, recordingStartTime } = useAudioStore();

  const points = samples.slice(-MAX_POINTS);

  const START_MS = recordingStartTime ?? samples[0]?.timestamp ?? Date.now();
  const TOTAL_MS = 10 * 60 * 1000; // fixed 10 minutes

  const polylinePoints = points
    .map((s) => {
      const x = PADDING.left + (Math.min(s.timestamp - START_MS, TOTAL_MS) / TOTAL_MS) * INNER_W;
      const y =
        PADDING.top +
        INNER_H -
        ((s.db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={styles.container}>
      {/* Y-axis label */}
      <View style={styles.yAxisLabelContainer}>
        <Text style={styles.yAxisLabel}>dB</Text>
      </View>

      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        {/* Y-axis grid + labels */}
        {Y_LABELS.map((db) => {
          const y =
            PADDING.top +
            INNER_H -
            ((db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
          return (
            <React.Fragment key={db}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={GRAPH_WIDTH - PADDING.right}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 4}
                y={y + 4}
                fontSize={8}
                fill="#8e8e93"
                textAnchor="end"
              >
                {db}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X-axis baseline */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top + INNER_H}
          x2={GRAPH_WIDTH - PADDING.right}
          y2={PADDING.top + INNER_H}
          stroke="#ccc"
          strokeWidth={1}
        />

        {/* X-axis ticks + labels — fixed 0–10m */}
        {X_LABELS.map((min) => {
          const x = PADDING.left + (min / 10) * INNER_W;
          return (
            <React.Fragment key={min}>
              {/* tick mark */}
              <Line
                x1={x}
                y1={PADDING.top + INNER_H}
                x2={x}
                y2={PADDING.top + INNER_H + 4}
                stroke="#ccc"
                strokeWidth={1}
              />
              {/* label */}
              <SvgText
                x={x}
                y={GRAPH_HEIGHT - 4}
                fontSize={8}
                fill="#8e8e93"
                textAnchor="middle"
              >
                {min === 0 ? '0' : `${min}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Data line — only when there are points */}
        {points.length > 1 && (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={isRecording ? '#007aff' : '#8e8e93'}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </Svg>

      {/* X-axis label */}
      <Text style={styles.xAxisLabel}>Time</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 16,
    width: Dimensions.get('window').width - 48,
  },
  yAxisLabelContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  yAxisLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },
  xAxisLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 2,
  },
});