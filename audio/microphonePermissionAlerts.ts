import { captureSentryException, getSentryErrorAttributes, logSentryError } from '@/analytics/sentry';
import i18n from '@/i18n';
import { Alert, Linking, Platform } from 'react-native';

type DeniedAlertOptions = {
  errorMessage: string;
  source: string;
};

function getMicrophonePermissionCopy() {
  return {
    title: i18n.t('permissions.micTitle'),
    message: i18n.t('permissions.micMessage'),
  };
}

export function showMicrophonePermissionRationale() {
  if (Platform.OS !== 'android') {
    return Promise.resolve();
  }

  const { title, message } = getMicrophonePermissionCopy();

  return new Promise<void>(resolve => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: () => resolve(),
        },
      ],
      { cancelable: false }
    );
  });
}

export function showMicrophonePermissionDeniedAlert({ errorMessage, source }: DeniedAlertOptions) {
  const { title, message } = getMicrophonePermissionCopy();

  Alert.alert(title, message, [
    { text: 'OK' },
    {
      text: 'Open settings',
      onPress: () => {
        Linking.openSettings().catch(error => {
          logSentryError(errorMessage, getSentryErrorAttributes(error));
          captureSentryException(error, errorMessage, { source });
        });
      },
    },
  ]);
}
