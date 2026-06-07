import { captureSentryException, getSentryErrorAttributes, logSentryError, logSentryWarning } from '@/analytics/sentry';
import {
  showMicrophonePermissionDeniedAlert,
  showMicrophonePermissionRationale,
} from '@/audio/microphonePermissionAlerts';
import { Alert } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

const isRecordingInitialized = async () => {
  const status = await AudioManager.checkRecordingPermissions();
  return status === 'Granted';
};

export const initRecording = async () => {
  if (!(await isRecordingInitialized())) {
    await showMicrophonePermissionRationale();

    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      logSentryWarning('Microphone permission denied', {
        permission,
        source: 'initRecording',
      });

      showMicrophonePermissionDeniedAlert({
        errorMessage: 'Failed to open app settings from initRecording alert',
        source: 'initRecording',
      });
      return false;
    }
  }

  AudioManager.setAudioSessionOptions({
    iosCategory: 'playAndRecord',
    iosMode: 'measurement',
  });

  const sessionActivated = await AudioManager.setAudioSessionActivity(true);
  if (!sessionActivated) {
    logSentryWarning('Audio session activation failed', {
      source: 'initRecording',
    });
    Alert.alert('Could not activate audio session.');
    return false;
  }

  return true;
};
