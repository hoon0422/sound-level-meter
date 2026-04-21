import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type StatsPanelProps = {
  elapsedSeconds: number;
  dbfs: number;
  peakHz: number | null;
  error: string | null;
};

export const StatsPanel = memo(function StatsPanel({
  elapsedSeconds,
  dbfs,
  peakHz,
  error,
}: StatsPanelProps) {
  return (
    <View style={styles.container}>
      <Text>Elapsed: {elapsedSeconds.toFixed(2)} s</Text>
      <Text>dBFS: {dbfs.toFixed(1)}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text>
        Peak Frequency: {peakHz != null ? `${peakHz.toFixed(0)} Hz` : "—"}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    color: "#ff6b6b",
  },
});
