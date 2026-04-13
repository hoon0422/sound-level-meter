import React, { useRef, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg';
import useAudioStore from '../store/audioStore';

const SCREEN_W = Dimensions.get('window').width;
const CONTAINER_W = SCREEN_W - 48;
const GRAPH_HEIGHT = 200;
const PAD = { top: 15, bottom: 25, left: 24, right: 8 };
const INNER_H = GRAPH_HEIGHT - PAD.top - PAD.bottom;

// 10 seconds fills the visible scroll area
const SCROLL_W = CONTAINER_W - PAD.left; // scrollable inner width for 10s
const PX_PER_SEC = SCROLL_W / 10;

const DB_MIN = 0;
const DB_MAX = 100;
const Y_LABELS = [0, 25, 50, 75, 100];

export default function SoundGraph() {
  const { isRecording, samples, recordingStartTime } = useAudioStore();
  const scrollRef = useRef<ScrollView>(null);

  const START_MS = recordingStartTime ?? samples[0]?.timestamp ?? Date.now();

  const totalSec = samples.length > 0
    ? (samples[samples.length - 1].timestamp - START_MS) / 1000
    : 0;

  // SVG grows past 10s; minimum fills the visible area
  const svgW = Math.max(SCROLL_W + PAD.right, totalSec * PX_PER_SEC + PAD.right);

  // X-axis tick every second, label every 5s
  const tickCount = Math.max(10, Math.ceil(totalSec));
  const xTicks = Array.from({ length: tickCount + 1 }, (_, i) => i);

  const polylinePoints = samples
    .map((s) => {
      const x = ((s.timestamp - START_MS) / 1000) * PX_PER_SEC;
      const y = PAD.top + INNER_H - ((s.db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
      return `${x},${y}`;
    })
    .join(' ');

  // Auto-scroll to latest while recording
  useEffect(() => {
    if (isRecording) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [samples.length, isRecording]);

  return (
    <View style={styles.container}>
      <View style={styles.yAxisLabel}>
        <Text style={styles.axisText}>dB</Text>
      </View>

      <View style={styles.graphRow}>
        {/* Fixed Y-axis labels */}
        <Svg width={PAD.left} height={GRAPH_HEIGHT} style={styles.yAxisSvg}>
          {Y_LABELS.map((db) => {
            const y = PAD.top + INNER_H - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
            return (
              <SvgText key={db} x={PAD.left - 3} y={y + 4} fontSize={8} fill="#8e8e93" textAnchor="end">
                {db}
              </SvgText>
            );
          })}
        </Svg>

        {/* Scrollable graph */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          scrollEventThrottle={16}
        >
          <Svg width={svgW} height={GRAPH_HEIGHT}>
            {/* Y-axis grid lines */}
            {Y_LABELS.map((db) => {
              const y = PAD.top + INNER_H - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
              return (
                <Line key={db} x1={0} y1={y} x2={svgW} y2={y} stroke="#e0e0e0" strokeWidth={1} />
              );
            })}

            {/* X-axis baseline */}
            <Line x1={0} y1={PAD.top + INNER_H} x2={svgW} y2={PAD.top + INNER_H} stroke="#ccc" strokeWidth={1} />

            {/* X-axis ticks + labels */}
            {xTicks.map((sec) => {
              const x = sec * PX_PER_SEC;
              return (
                <React.Fragment key={sec}>
                  <Line
                    x1={x} y1={PAD.top + INNER_H}
                    x2={x} y2={PAD.top + INNER_H + 4}
                    stroke="#ccc" strokeWidth={1}
                  />
                  {sec % 5 === 0 && (
                    <SvgText x={x} y={GRAPH_HEIGHT - 4} fontSize={8} fill="#8e8e93" textAnchor="middle">
                      {sec}s
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}

            {/* Data line */}
            {samples.length > 1 && (
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
        </ScrollView>
      </View>

      <Text style={styles.xAxisLabel}>Time (s)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 16,
    width: CONTAINER_W,
  },
  yAxisLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  axisText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },
  graphRow: {
    flexDirection: 'row',
  },
  yAxisSvg: {
    flexShrink: 0,
  },
  xAxisLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 2,
  },
});
