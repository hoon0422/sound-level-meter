import { useTheme } from '@/context/ThemeContext';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import React, { useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Surface from './Surface';

const SCREEN_W = Dimensions.get('window').width;
const CONTAINER_W = SCREEN_W - 48;
const INNER_H = 110;
const X_AXIS_H = 20;
const GRAPH_H = INNER_H + X_AXIS_H;
const Y_AXIS_W = 28;
const CHART_W = CONTAINER_W - Y_AXIS_W - 16;
const PX_PER_SEC = 30;
const MIN_PX_SPACING = 6; // downsample: ~5 pts/sec max

const DB_MIN = 0;
const DB_MAX = 120;
const Y_LABELS = [120, 100, 80, 60, 40, 20, 0];
const GRID_DBS = [20, 40, 60, 80, 100, 120];

type Sample = { db: number; timestamp: number };
type DisplayPoint = { x: number; y: number };

function dbToY(db: number) {
  return INNER_H - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
}

function dbToTop(db: number) {
  return ((DB_MAX - db) / (DB_MAX - DB_MIN)) * INNER_H;
}

function LineSegment({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const { colors } = useTheme();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.5) return null;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View
      style={{
        position: 'absolute',
        left: (x1 + x2) / 2 - length / 2,
        top: (y1 + y2) / 2 - 0.75,
        width: length,
        height: 1.5,
        backgroundColor: colors.primary,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

export default function SoundGraph() {
  const { colors } = useTheme();
  const isRunning = useAudioMeterStore(state => state.isRunning);
  const { dbfs, elapsedSeconds } = useThrottledAudioMeterValue(state => ({
    dbfs: state.dbfs,
    elapsedSeconds: state.elapsedSeconds,
  }));
  const [samples, setSamples] = React.useState<Sample[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isRunning) {
      setSamples([]);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && elapsedSeconds > 0 && dbfs > 0) {
      setSamples(prev => [...prev, { db: dbfs, timestamp: elapsedSeconds }]);
    }
  }, [dbfs, elapsedSeconds, isRunning]);

  useEffect(() => {
    if (isRunning) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [dbfs, isRunning]);

  // const samples = samplesRef.current;
  const totalElapsed = samples.length > 0 ? samples[samples.length - 1].timestamp : 0;
  const innerW = Math.max(CHART_W, totalElapsed * PX_PER_SEC);

  // Downsample for display: keep at most one point per MIN_PX_SPACING px
  const displayPoints: DisplayPoint[] = [];
  let lastX = -Infinity;
  for (const s of samples) {
    const x = s.timestamp * PX_PER_SEC;
    if (x - lastX >= MIN_PX_SPACING) {
      displayPoints.push({ x, y: dbToY(s.db) });
      lastX = x;
    }
  }
  // Always include the last sample
  if (samples.length > 0) {
    const last = samples[samples.length - 1];
    const lastX2 = last.timestamp * PX_PER_SEC;
    const prev = displayPoints[displayPoints.length - 1];
    if (!prev || lastX2 - prev.x > 1) {
      displayPoints.push({ x: lastX2, y: dbToY(last.db) });
    }
  }

  // Time labels every 5 seconds
  const timeLabels: { x: number; label: string }[] = [];
  let nextSec = 0;
  for (const s of samples) {
    const elapsed = s.timestamp;
    if (elapsed >= nextSec) {
      timeLabels.push({ x: s.timestamp * PX_PER_SEC, label: `${nextSec}s` });
      nextSec += 5;
    }
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.yAxisLabel}>
        <Text style={[styles.axisText, { color: colors.mutedText }]}>dB</Text>
      </View>
      <View style={styles.graphRow}>
        {/* Fixed Y-axis */}
        <View style={{ width: Y_AXIS_W, height: GRAPH_H }}>
          {Y_LABELS.map(db => (
            <Text key={`y-${db}`} style={[styles.yLabelText, { color: colors.inactive, top: dbToTop(db) - 6 }]}>
              {db}
            </Text>
          ))}
        </View>

        {/* Scrollable chart */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          <View style={{ width: innerW, height: GRAPH_H }}>
            {/* Grid lines */}
            {GRID_DBS.map(db => (
              <View
                key={`grid-${db}`}
                style={[styles.gridLine, { backgroundColor: colors.divider, top: dbToTop(db), width: innerW }]}
              />
            ))}
            {/* Baseline */}
            <View style={[styles.baseline, { backgroundColor: colors.divider, width: innerW }]} />

            {/* Line segments */}
            {displayPoints.slice(1).map((pt, i) => (
              <LineSegment key={`seg-${i}`} x1={displayPoints[i].x} y1={displayPoints[i].y} x2={pt.x} y2={pt.y} />
            ))}

            {/* Current point dot */}
            {displayPoints.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  left: displayPoints[displayPoints.length - 1].x - 3,
                  top: displayPoints[displayPoints.length - 1].y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isRunning ? colors.primary : colors.inactive,
                }}
              />
            )}

            {/* X-axis labels */}
            {timeLabels.map(({ x, label }) => (
              <Text key={`lbl-${label}`} style={[styles.xLabel, { color: colors.mutedText, left: x }]}>
                {label}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
      <Text style={[styles.xAxisLabel, { color: colors.mutedText }]}>Time (s)</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, width: '100%' },
  yAxisLabel: {
    fontSize: 10,
    position: 'absolute',
    top: 8,
    left: 8,
  },
  axisText: {
    fontSize: 9,
    fontWeight: '600',
  },
  graphRow: {
    flexDirection: 'row',
  },
  yLabelText: {
    position: 'absolute',
    right: 4,
    fontSize: 11,
    textAlign: 'right',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    height: 1,
  },
  baseline: {
    position: 'absolute',
    top: INNER_H,
    left: 0,
    height: 1,
  },
  xLabel: {
    position: 'absolute',
    top: INNER_H + 4,
    fontSize: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
});
