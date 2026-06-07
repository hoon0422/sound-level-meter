import {
  captureSentryException,
  getSentryErrorAttributes,
  logSentryError,
  logSentryWarning,
  traceSentrySpan,
} from '@/analytics/sentry';
import {
  showMicrophonePermissionDeniedAlert,
} from '@/audio/microphonePermissionAlerts';
import { Alert } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

const isRecordingInitialized = async () => {
  const status = await traceSentrySpan(
    {
      name: 'Check microphone permission',
      op: 'audio.permission.check',
    },
    () => AudioManager.checkRecordingPermissions()
  );
  return status === 'Granted';
};

export const initRecording = async () => {
  if (!(await isRecordingInitialized())) {
    const permission = await traceSentrySpan(
      {
        name: 'Request microphone permission',
        op: 'audio.permission.request',
      },
      () => AudioManager.requestRecordingPermissions()
    );
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

  traceSentrySpan(
    {
      name: 'Set audio session options',
      op: 'audio.session.configure',
    },
    () => {
      AudioManager.setAudioSessionOptions({
        iosCategory: 'playAndRecord',
        iosMode: 'measurement',
      });
    }
  );

  const sessionActivated = await traceSentrySpan(
    {
      name: 'Activate audio session',
      op: 'audio.session.activate',
    },
    () => AudioManager.setAudioSessionActivity(true)
  );
  if (!sessionActivated) {
    logSentryWarning('Audio session activation failed', {
      source: 'initRecording',
    });
    Alert.alert('Could not activate audio session.');
    return false;
  }

  return true;
};
