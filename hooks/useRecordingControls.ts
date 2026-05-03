import { DEFAULT_CONFIG } from '@/audio/constants';
import { useMicrophoneSpectrumStore } from '@/store/microphoneSpectrumStore';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

const isRecordingInitialized = async () => {
  const status = await AudioManager.checkRecordingPermissions();
  return status === 'Granted';
};

const initRecording = async () => {
  if (!(await isRecordingInitialized())) {
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      Alert.alert('Permission to access microphone was denied', undefined, [
        { text: 'OK' },
        {
          text: 'Open settings',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ]);
      return false;
    }
  }

  AudioManager.setAudioSessionOptions({
    iosCategory: 'playAndRecord',
    iosMode: 'measurement',
  });

  const sessionActivated = await AudioManager.setAudioSessionActivity(true);
  if (!sessionActivated) {
    Alert.alert('Could not activate audio session.');
    return false;
  }

  return true;
};

export function useRecordingControls() {
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const {
    configureAudioMetrics,
    configureSpectrum,
    isConnecting,
    isDisconnecting,
    isRunning,
    isStarting,
    isStopping,
    start,
    stop,
  } = useMicrophoneSpectrumStore(state => ({
    configureAudioMetrics: state.configureAudioMetrics,
    configureSpectrum: state.configureSpectrum,
    isConnecting: state.isConnecting,
    isDisconnecting: state.isDisconnecting,
    isRunning: state.isRunning,
    isStarting: state.isStarting,
    isStopping: state.isStopping,
    start: state.start,
    stop: state.stop,
  }));

  const startRecording = useCallback(async () => {
    setIsPreparingRecording(true);

    try {
      const canRecord = await initRecording();
      if (!canRecord) {
        return;
      }

      configureSpectrum(DEFAULT_CONFIG);
      configureAudioMetrics(DEFAULT_CONFIG);
      await start(DEFAULT_CONFIG);
    } finally {
      setIsPreparingRecording(false);
    }
  }, [configureSpectrum, configureAudioMetrics, start]);

  const toggleRecording = useCallback(() => {
    if (isRunning) {
      void stop();
      return;
    }

    void startRecording();
  }, [isRunning, startRecording, stop]);

  const isBusy = isPreparingRecording || isConnecting || isStarting || isStopping || isDisconnecting;

  return {
    isBusy,
    isPreparingRecording,
    toggleRecording,
  };
}
