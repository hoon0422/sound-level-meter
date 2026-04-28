import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnalysisGraph from '@/components/AnalysisGraph';
import { useSoundLevelMeter } from '@/hooks/useSoundLevelMeter';
import { useTheme } from '@/context/ThemeContext';

const DISPLAY_INTERVAL_MS = 300;

export default function SoundGuideScreen() {
  const { colors } = useTheme();
  const { dbfs, isRunning, isBusy, toggleRecording } = useSoundLevelMeter();
  const [displayDb, setDisplayDb] = useState(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= DISPLAY_INTERVAL_MS) {
      setDisplayDb(dbfs);
      lastUpdateRef.current = now;
    }
  }, [dbfs]);

  const dbDisplay = isRunning ? `${displayDb.toFixed(1)} dB` : '— dB';

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Text style={[styles.dbText, { color: colors.text }]}>{dbDisplay}</Text>
      <AnalysisGraph />
      <TouchableOpacity
        style={[styles.micButton, isRunning && styles.micButtonRecording]}
        onPress={toggleRecording}
        disabled={isBusy}
        activeOpacity={0.8}
      >
        <Ionicons name={isRunning ? 'stop' : 'mic'} size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  dbText: {
    fontSize: 48,
    fontWeight: '700',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#333333',
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  micButtonRecording: {
    backgroundColor: '#cc3300',
  },
});
