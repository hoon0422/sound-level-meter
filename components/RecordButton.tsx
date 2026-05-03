import { DEFAULT_CONFIG } from '@/audio/constants';
import { useMicrophoneSpectrumStore } from '@/store/microphoneSpectrumStore';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export function RecordButton() {
  const { toggleDisabled, toggle, isRunning } = useToggleRecording();

  return (
    <TouchableOpacity
      style={[styles.micButton, isRunning && styles.micButtonRecording]}
      onPress={toggle}
      disabled={toggleDisabled}
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

const useToggleRecording = () => {
  const { isRunning, stop, start, configureAudioMetrics, configureSpectrum, isBusy } = useMicrophoneSpectrumStore(
    state => {
      const isBusy =
        state.isConnecting || state.isStarting || state.isStopping || state.isDisconnecting || state.isConnecting;
      return {
        isRunning: state.isRunning,
        stop: state.stop,
        start: state.start,
        isBusy,
        configureSpectrum: state.configureSpectrum,
        configureAudioMetrics: state.configureAudioMetrics,
      };
    }
  );
  const startRecording = useCallback(() => {
    configureSpectrum(DEFAULT_CONFIG);
    configureAudioMetrics(DEFAULT_CONFIG);
    start(DEFAULT_CONFIG);
  }, [configureSpectrum, configureAudioMetrics, start]);

  return {
    toggleDisabled: isBusy,
    toggle: isRunning ? stop : startRecording,
    isRunning,
  };
};
