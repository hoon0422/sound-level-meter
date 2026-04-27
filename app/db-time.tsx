import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SoundGraph from '@/components/SoundGraph';
import { useSoundLevelMeter } from '@/hooks/useSoundLevelMeter';

const DISPLAY_INTERVAL_MS = 300;

export default function DbTimeScreen() {
  const { dbfs, isBusy, isRunning, toggleRecording } = useSoundLevelMeter();
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
    <View style={styles.page}>
      <Text style={styles.dbText}>{dbDisplay}</Text>
      <SoundGraph />
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
    backgroundColor: '#FEFAEE',
  },
  dbText: {
    fontSize: 52,
    fontWeight: '700',
    color: '#000',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  micButtonRecording: {
    backgroundColor: '#cc3300',
  },
});
