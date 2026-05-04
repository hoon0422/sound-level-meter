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
