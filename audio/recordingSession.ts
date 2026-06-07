import { captureSentryException, getSentryErrorAttributes, logSentryError, logSentryWarning } from '@/analytics/sentry';
import {
  showMicrophonePermissionDeniedAlert,
  showMicrophonePermissionRationale,
} from '@/audio/microphonePermissionAlerts';
import { Alert } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

export async function hasRecordingPermission() {
  const status = await AudioManager.checkRecordingPermissions();
  return status === 'Granted';
}

export async function requestRecordingSession(options: { showDeniedAlert?: boolean } = {}) {
  if (!(await hasRecordingPermission())) {
    await showMicrophonePermissionRationale();

    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      logSentryWarning('Microphone permission denied', {
        permission,
      });

      if (options.showDeniedAlert) {
        showMicrophonePermissionDeniedAlert({
          errorMessage: 'Failed to open app settings from microphone permission alert',
          source: 'recording_permission_alert',
        });
      }
      return false;
    }
  }

  AudioManager.setAudioSessionOptions({
    iosCategory: 'playAndRecord',
    iosMode: 'measurement',
  });

  const sessionActivated = await AudioManager.setAudioSessionActivity(true);
  if (!sessionActivated) {
    logSentryWarning('Audio session activation failed');

    if (options.showDeniedAlert) {
      Alert.alert('Could not activate audio session.');
    }
    return false;
  }

  return true;
}
