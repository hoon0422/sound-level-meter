import { useTheme } from '@/context/ThemeContext';
import { useRecordingControls } from '@/hooks/useRecordingControls';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

export function RecordButton() {
  const { colors } = useTheme();
  const { isBusy, toggleRecording } = useRecordingControls();
  const isMeasurementRunning = useAudioMeterStore(state => state.isRunning && state.sessionMode === 'measurement');

  return (
    <TouchableOpacity
      style={[
        styles.micButton,
        {
          backgroundColor: isMeasurementRunning ? colors.loud : colors.primary,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={toggleRecording}
      disabled={isBusy}
      activeOpacity={0.8}
    >
      {isMeasurementRunning ? (
        <Ionicons name="stop" size={32} color="#FFFFFF" />
      ) : (
        <Image source={require('@/assets/icons/mic.png')} style={{ height: 38, width: 120 }} resizeMode="contain" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
});
