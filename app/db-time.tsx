import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SoundGraph from '@/components/SoundGraph';
import { useSoundLevelMeter } from '@/hooks/useSoundLevelMeter';
import { useTheme } from '@/context/ThemeContext';

const DISPLAY_INTERVAL_MS = 300;

export default function DbTimeScreen() {
  const { colors } = useTheme();
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
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <Text style={[styles.dbText, { color: colors.text }]}>{dbDisplay}</Text>
      <SoundGraph />
      <TouchableOpacity
        style={[styles.micButton, isRunning && styles.micButtonRecording]}
        onPress={toggleRecording}
        disabled={isBusy}
        activeOpacity={0.8}
      >
        {isRunning ? (
          <Ionicons name="stop" size={32} color="#fff" />
        ) : (
          <Image source={require('./assets/icons/mic.png')} style={{ height: 38, width: 120 }} resizeMode="contain" />
        )}
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
    fontSize: 52,
    fontWeight: '700',
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
