import React from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import useAudioStore from '../store/audioStore';

const OFFSET = 90;
const MAX_POINTS = 6000; // 10min × 60s × ~10 samples/sec

const GRAPH_WIDTH = Dimensions.get('window').width - 48;
const GRAPH_HEIGHT = 200;
const PADDING = { top: 15, bottom: 25, left: 20, right: 25 };

const INNER_W = GRAPH_WIDTH - PADDING.left - PADDING.right;
const INNER_H = GRAPH_HEIGHT - PADDING.top - PADDING.bottom;

const DB_MIN = 0;
const DB_MAX = 100;
const Y_LABELS = [0, 25, 50, 75, 100];
const X_LABELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const RANGES = [
  { num: "<20", label: "Barely audible" },
  { num: "30", label: "Quiet forest" },
  { num: "40", label: "Library" },
  { num: "50", label: "Light rainfall" },
  { num: "60", label: "Casual talk" },
  { num: "70", label: "Busy street" },
  { num: "80", label: "Heavy traffic" },
  { num: "90", label: "Subway" },
  { num: "100", label: "Plane taking off" },
  { num: ">110", label: "Danger zone" },
];

export default function AnalysisGraph() {
  const { isRecording, metering, addSample, samples, recordingStartTime } = useAudioStore();

  useEffect(() => {
    if (!isRecording) return;
    if (metering === undefined || metering === null) return;

    addSample({
      db: Math.min(DB_MAX, Math.max(DB_MIN, metering + OFFSET)),
      timestamp: Date.now(),
    });
  }, [metering]);

  return (
    <View style={styles.container}>
      {RANGES.map((range) => (
        <View key={range.num} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 100 }}>
            <Text style={{ fontSize: 12, color: '#6b6b6b' }}>{range.num}dB</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#6b6b6b' }}>{range.label}</Text>
        </View>
      ))}
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
});