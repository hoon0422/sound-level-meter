import { Alert, Linking } from 'react-native';
import { AudioManager } from 'react-native-audio-api';

export async function hasRecordingPermission() {
  const status = await AudioManager.checkRecordingPermissions();
  return status === 'Granted';
}

export async function requestRecordingSession(options: { showDeniedAlert?: boolean } = {}) {
  if (!(await hasRecordingPermission())) {
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== 'Granted') {
      if (options.showDeniedAlert) {
        Alert.alert('Permission to access microphone was denied', undefined, [
          { text: 'OK' },
          {
            text: 'Open settings',
            onPress: () => {
              Linking.openSettings();
            },
          },
        ]);
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
    if (options.showDeniedAlert) {
      Alert.alert('Could not activate audio session.');
    }
    return false;
  }

  return true;
}
