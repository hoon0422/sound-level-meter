import { useRecordingControls } from '@/hooks/useRecordingControls';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';

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
      <Ionicons name={isRunning ? 'stop' : 'mic'} size={32} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
