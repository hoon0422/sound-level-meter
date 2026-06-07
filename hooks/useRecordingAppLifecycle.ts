import {
  captureSentryException,
  getSentryErrorAttributes,
  logSentryError,
  logSentryInfo,
} from '@/analytics/sentry';
import { audioMeterStore, useAudioMeterStore } from '@/store/audioMeterStore';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const RECORDING_KEEP_AWAKE_TAG = 'decibella-recording';

function stopRecordingIfActive(nextState: AppStateStatus) {
  const state = audioMeterStore.getState();

  if (!state.isRunning) {
    return;
  }

  logSentryInfo('Recording stopped because app left active state', {
    appState: nextState,
  });
  state.stop();
}

export function useRecordingAppLifecycle() {
  const isRunning = useAudioMeterStore(state => state.isRunning);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') {
        stopRecordingIfActive(nextState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    if (AppState.currentState !== 'active') {
      stopRecordingIfActive(AppState.currentState);
      return;
    }

    activateKeepAwakeAsync(RECORDING_KEEP_AWAKE_TAG).catch(error => {
      logSentryError('Failed to keep screen awake during recording', getSentryErrorAttributes(error));
      captureSentryException(error, 'Failed to keep screen awake during recording');
    });

    return () => {
      deactivateKeepAwake(RECORDING_KEEP_AWAKE_TAG).catch(error => {
        logSentryError('Failed to release recording keep-awake lock', getSentryErrorAttributes(error));
        captureSentryException(error, 'Failed to release recording keep-awake lock');
      });
    };
  }, [isRunning]);
}
