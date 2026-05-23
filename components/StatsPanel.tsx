import { useTheme } from '@/context/ThemeContext';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StatsPanelProps = {
  elapsedSeconds: number;
  dbfs: number;
  peakHz: number | null;
  error: string | null;
};

export const StatsPanel = memo(function StatsPanel({ elapsedSeconds, dbfs, peakHz, error }: StatsPanelProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={{ color: colors.text }}>Elapsed: {elapsedSeconds.toFixed(2)} s</Text>
      <Text style={{ color: colors.text }}>dBFS: {dbfs.toFixed(1)}</Text>
      {error ? <Text style={{ color: colors.loud }}>{error}</Text> : null}
      <Text style={{ color: colors.text }}>Peak Frequency: {peakHz != null ? `${peakHz.toFixed(0)} Hz` : '—'}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
