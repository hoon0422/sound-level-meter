import { captureSentryException, getSentryErrorAttributes, logSentryError, logSentryWarning } from '@/analytics/sentry';
import { Alert, Linking } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

const isRecordingInitialized = async () => {
  const status = await AudioManager.checkRecordingPermissions();
  return status === 'Granted';
};

export const initRecording = async () => {
  if (!(await isRecordingInitialized())) {
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      logSentryWarning('Microphone permission denied', {
        permission,
        source: 'initRecording',
      });

      Alert.alert('Permission to access microphone was denied', undefined, [
        { text: 'OK' },
        {
          text: 'Open settings',
          onPress: () => {
            Linking.openSettings().catch(error => {
              logSentryError('Failed to open app settings from initRecording alert', getSentryErrorAttributes(error));
              captureSentryException(error, 'Failed to open app settings from initRecording alert', {
                source: 'initRecording',
              });
            });
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
    logSentryWarning('Audio session activation failed', {
      source: 'initRecording',
    });
    Alert.alert('Could not activate audio session.');
    return false;
  }

  return true;
};
