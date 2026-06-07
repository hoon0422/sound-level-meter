import { captureSentryException, getSentryErrorAttributes, logSentryError } from '@/analytics/sentry';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const RECORDING_NOTIFICATION = {
  title: 'Decibella',
  contentText: 'Measuring sound in the background',
  paused: false,
};

type RemovableSubscription = {
  remove: () => void;
};

async function getRecordingNotificationManager() {
  if (Platform.OS !== 'android') {
    return null;
  }

  const { RecordingNotificationManager } = await import('react-native-audio-api');
  return RecordingNotificationManager;
}

export function useBackgroundRecordingNotification() {
  const { isRunning, start, stop } = useAudioMeterStore(state => ({
    isRunning: state.isRunning,
    start: state.start,
    stop: state.stop,
  }));

  useEffect(() => {
    let didDispose = false;
    let pauseSubscription: RemovableSubscription | null = null;
    let resumeSubscription: RemovableSubscription | null = null;

    getRecordingNotificationManager()
      .then(manager => {
        if (!manager || didDispose) {
          return;
        }

        pauseSubscription = manager.addEventListener('recordingNotificationPause', () => {
          void stop();
        });
        resumeSubscription = manager.addEventListener('recordingNotificationResume', () => {
          void start(DEFAULT_CONFIG);
        });
      })
      .catch(error => {
        logSentryError('Background recording notification listener setup failed', getSentryErrorAttributes(error));
        captureSentryException(error, 'Background recording notification listener setup failed');
      });

    return () => {
      didDispose = true;
      pauseSubscription?.remove();
      resumeSubscription?.remove();
    };
  }, [start, stop]);

  useEffect(() => {
    let shouldHideOnCleanup = false;

    getRecordingNotificationManager()
      .then(manager => {
        if (!manager) {
          return;
        }

        if (isRunning) {
          shouldHideOnCleanup = true;
          return manager.show(RECORDING_NOTIFICATION);
        }

        return manager.hide();
      })
      .catch(error => {
        logSentryError('Background recording notification update failed', getSentryErrorAttributes(error));
        captureSentryException(error, 'Background recording notification update failed');
      });

    return () => {
      if (!shouldHideOnCleanup) {
        return;
      }

      getRecordingNotificationManager()
        .then(manager => manager?.hide())
        .catch(error => {
          logSentryError('Background recording notification cleanup failed', getSentryErrorAttributes(error));
          captureSentryException(error, 'Background recording notification cleanup failed');
        });
    };
  }, [isRunning]);
}
