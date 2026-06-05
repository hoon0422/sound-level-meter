import { DEFAULT_CONFIG } from '@/audio/constants';
import { requestRecordingSession } from '@/audio/recordingSession';
import { APP_ANALYTICS_EVENTS, trackAppEvent } from '@/analytics/events';
import { useAudioMeterStore } from '@/store/audioMeterStore';
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
        return;
      }

      configureSpectrum(DEFAULT_CONFIG);
      configureAudioMetrics(DEFAULT_CONFIG);
      await start(DEFAULT_CONFIG);
    } finally {
      setIsPreparingRecording(false);
    }
  }, [configureSpectrum, configureAudioMetrics, start]);

  const toggleRecording = useCallback(() => {
    if (isRunning) {
      trackAppEvent(APP_ANALYTICS_EVENTS.stopButtonClicked);
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
