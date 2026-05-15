import { useRecordingControls } from '@/hooks/useRecordingControls';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

export function RecordButton() {
  const { isBusy, toggleRecording } = useRecordingControls();
  const isRunning = useAudioMeterStore(state => state.isRunning);

  return (
    <TouchableOpacity
      style={[styles.micButton, isRunning && styles.micButtonRecording]}
      onPress={toggleRecording}
      disabled={isBusy}
      activeOpacity={0.8}
    >
      {isRunning ? (
          <Ionicons name="stop" size={32} color="#fff" />
        ) : (
          <Image source={require('../app/assets/icons/mic.png')} style={{ height: 38, width: 120 }} resizeMode="contain" />
        )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
