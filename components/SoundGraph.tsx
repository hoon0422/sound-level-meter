import { useTheme } from '@/context/ThemeContext';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import React, { useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Surface from './Surface';
import { audioMeterStore, useAudioMeterStore } from '@/store/audioMeterStore';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Line, Polyline } from 'react-native-svg';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const CONTAINER_HEIGHT = 180;
const CONTAINER_VERTICAL_PADDING = 8;
const CONTAINER_HORIZONTAL_PADDING = 8;
const CONTAINER_RIGHT_PADDING = 24;
const CONTAINER_WIDTH = 320;
const INNER_H = 110;
const X_AXIS_H = 20;
const Y_AXIS_WIDTH = 28;
const CHART_WIDTH = CONTAINER_WIDTH - Y_AXIS_WIDTH - CONTAINER_HORIZONTAL_PADDING - CONTAINER_RIGHT_PADDING;
const PX_PER_SEC = 30;

const DB_MIN = 0;
const DB_MAX = 120;
const Y_LABELS = ['dB', 120, 100, 80, 60, 40, 20, 0];
const GRID_DBS = [40, 80, 120];

type Sample = { db: number; timestamp: number };
type DisplayPoint = { x: number; y: number };

// Module-level history — persists across component remounts
const sampleHistory: Sample[] = [];
let _lastSampleTime = 0;
let _lastSampleTimestamp = -1;
audioMeterStore.subscribe(state => {
  if (!state.isRunning) {
    sampleHistory.length = 0;
    _lastSampleTime = 0;
    _lastSampleTimestamp = -1;
    return;
  }
  const now = Date.now();
  if (
    state.elapsedSeconds > 0 &&
    state.dbfs > 0 &&
    state.elapsedSeconds !== _lastSampleTimestamp &&
    now - _lastSampleTime >= 300
  ) {
    sampleHistory.push({ db: state.dbfs, timestamp: state.elapsedSeconds });
    _lastSampleTimestamp = state.elapsedSeconds;
    _lastSampleTime = now;
  }
});

function dbToY(db: number) {
  return INNER_H - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * INNER_H;
}

function dbToTop(db: number) {
  return ((DB_MAX - db) / (DB_MAX - DB_MIN)) * INNER_H;
}


export default function SoundGraph() {
  const { typography, colors } = useTheme();
  const isRunning = useAudioMeterStore(state => state.isRunning);
  const { dbfs, elapsedSeconds } = useThrottledAudioMeterValue(state => ({
    dbfs: state.dbfs,
    elapsedSeconds: state.elapsedSeconds,
  }));
  const [samples, setSamples] = React.useState<Sample[]>(() => [...sampleHistory]);
  const liveX = useSharedValue(0);
  const liveY = useSharedValue(INNER_H / 2);

  useEffect(() => {
    if (!isRunning) {
      setSamples([]);
      liveX.value = 0;
      liveY.value = INNER_H / 2;
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && elapsedSeconds > 0 && dbfs > 0) {
      setSamples([...sampleHistory]);
    }
  }, [dbfs, elapsedSeconds, isRunning]);

  const totalElapsed = samples.length > 0 ? samples[samples.length - 1].timestamp : 0;
  const innerW = Math.max(CHART_WIDTH, totalElapsed * PX_PER_SEC);

  // Downsample for display: keep at most one point per MIN_PX_SPACING px
  const displayPoints: DisplayPoint[] = [];
  for (const s of samples) {
    const x = s.timestamp * PX_PER_SEC;
    displayPoints.push({ x, y: dbToY(s.db) });
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

  // Static x-axis labels: always show 0–10
  const staticXLabels = Array.from({ length: 11 }, (_, i) => i);

  // Animate live endpoint smoothly to each new sample over the throttle interval
  useEffect(() => {
    if (displayPoints.length < 1) return;
    const last = displayPoints[displayPoints.length - 1];
    if (displayPoints.length === 1) {
      liveX.value = last.x;
      liveY.value = last.y;
    } else {
      liveX.value = withTiming(last.x, { duration: 300, easing: Easing.linear });
      liveY.value = withTiming(last.y, { duration: 300, easing: Easing.linear });
    }
  }, [displayPoints.length]);

  // Animated props for the live segment endpoint
  const animatedLiveProps = useAnimatedProps(() => ({
    x2: liveX.value,
    y2: liveY.value,
  }));

  // Animated style for the current dot
  const animatedDotStyle = useAnimatedStyle(() => ({
    left: liveX.value - 3,
    top: liveY.value - 3,
  }));

  // Smooth scroll: shift content left as liveX passes the chart width
  const scrollAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -Math.max(0, liveX.value - CHART_WIDTH) }],
  }));

  // Historical polyline: all points except the last (static, no animation)
  const histPoints = displayPoints.slice(0, -1);
  const historicalStr = histPoints.map(p => `${p.x},${p.y}`).join(' ');
  const liveSegStart = displayPoints.length >= 2
    ? displayPoints[displayPoints.length - 2]
    : displayPoints[0];

  return (
    <Surface style={styles.container}>
      <View style={styles.graphRow}>
        {/* Fixed Y-axis */}
        <View style={{ width: Y_AXIS_WIDTH, height: INNER_H }}>
          {Y_LABELS.map(db => (
            <Text key={`y-${db}`} style={[styles.yLabelText, { top: typeof db === 'string' ? dbToTop(145) : dbToTop(db) - 6, color: colors.inactive, marginTop: 0, fontFamily: typography.fontFamily }]}>
              {db}
            </Text>
          ))}
        </View>

        {/* Chart + x-axis column */}
        <View style={{ flex: 1 }}>
          {/* Y-axis line: extends from dB label down to bottom of chart */}
          <View style={{
            position: 'absolute',
            top: dbToTop(140) + 3,
            left: 0,
            width: 1,
            height: INNER_H - (dbToTop(140) + 3),
            backgroundColor: '#d0d0d0',
          }} />
          {/* Scrollable chart area */}
          <View style={{ height: INNER_H, overflow: 'hidden' }}>
            <Animated.View style={[{ width: innerW, height: INNER_H }, scrollAnimStyle]}>
              {/* Grid lines */}
              {GRID_DBS.map(db => (
                <View key={`grid-${db}`} style={[styles.gridLine, { top: dbToTop(db), width: innerW }]} />
              ))}

              {/* SVG line */}
              <Svg width={innerW} height={INNER_H} style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Static historical segments */}
                {histPoints.length >= 2 && (
                  <Polyline
                    points={historicalStr}
                    fill="none"
                    stroke="#3bbfce"
                    strokeWidth={2}
                  />
                )}
                {/* Animated live segment */}
                {displayPoints.length >= 1 && liveSegStart && (
                  <AnimatedLine
                    x1={liveSegStart.x}
                    y1={liveSegStart.y}
                    stroke="#3bbfce"
                    strokeWidth={2}
                    animatedProps={animatedLiveProps}
                  />
                )}
              </Svg>

              {/* Current point dot (follows live position) */}
              {displayPoints.length > 0 && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isRunning ? '#3bbfce' : colors.inactive,
                    },
                    animatedDotStyle,
                  ]}
                />
              )}
            </Animated.View>
            {/* Fixed x-axis line */}
            <View style={styles.xAxisLine} />
          </View>

          {/* Static x-axis labels: always show 0–10 */}
          <View style={{ height: X_AXIS_H, position: 'relative' }}>
            {staticXLabels.map(sec => (
              <Text
                key={`x-${sec}`}
                style={[styles.xLabel, { left: (sec / 10) * CHART_WIDTH - (sec > 0 ? 4 : 0), fontFamily: typography.fontFamily }]}
              >
                {sec}
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
  graphContainer: {
    width: '100%',
     height: '100%',
     overflow: 'hidden',
  },
  graphRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  yLabelText: {
    position: 'absolute',
    right: 10,
    fontSize: 10,
    color: '#888888',
    textAlign: 'right',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    height: 1,
    backgroundColor: '#d0d0d0',
  },
  xAxisLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#d0d0d0',
  },
  xLabel: {
    position: 'absolute',
    top: 4,
    fontSize: 10,
    color: '#888888',
  },
});
