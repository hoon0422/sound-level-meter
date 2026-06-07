import { DEFAULT_CONFIG } from '@/audio/constants';
import { requestRecordingSession } from '@/audio/recordingSession';
import { APP_ANALYTICS_EVENTS, trackAppEvent } from '@/analytics/events';
import {
  captureSentryException,
  getSentryErrorAttributes,
  getSentryErrorMessage,
  logSentryError,
  logSentryInfo,
  logSentryWarning,
} from '@/analytics/sentry';
import { audioMeterStore, useAudioMeterStore } from '@/store/audioMeterStore';
import { useCallback, useState } from 'react';

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
  } = useAudioMeterStore(state => ({
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
      const canRecord = await requestRecordingSession({ showDeniedAlert: true });
      if (!canRecord) {
        logSentryWarning('Recording start blocked', {
          reason: 'recording_session_unavailable',
        });
        return;
      }

      configureSpectrum(DEFAULT_CONFIG);
      configureAudioMetrics(DEFAULT_CONFIG);
      const didStart = await start(DEFAULT_CONFIG);

      if (didStart) {
        logSentryInfo('Recording started', {
          sampleRate: DEFAULT_CONFIG.sampleRate,
          fftSize: DEFAULT_CONFIG.fftSize,
        });
      } else {
        logSentryWarning('Recording start failed', {
          reason: 'microphone_controller_start_returned_false',
        });
      }
    } catch (error) {
      logSentryError('Recording start threw', getSentryErrorAttributes(error));
      captureSentryException(error, 'Recording start threw');
      audioMeterStore.setState({
        error: getSentryErrorMessage(error, 'Unknown recording start error occurred'),
      });
    } finally {
      setIsPreparingRecording(false);
    }
  }, [configureSpectrum, configureAudioMetrics, start]);

  const toggleRecording = useCallback(() => {
    if (isRunning) {
      trackAppEvent(APP_ANALYTICS_EVENTS.stopButtonClicked);
      logSentryInfo('Recording stopped');
      void stop();
      return;
    }

    trackAppEvent(APP_ANALYTICS_EVENTS.startButtonClicked);
    void startRecording();
  }, [isRunning, startRecording, stop]);

  const isBusy = isPreparingRecording || isConnecting || isStarting || isStopping || isDisconnecting;

  return {
    isBusy,
    isPreparingRecording,
    toggleRecording,
  };
}
