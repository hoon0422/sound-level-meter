import { DEFAULT_CONFIG } from "@/audio/constants";
import { useMicrophoneSpectrumStore } from "@/stores/useMicrophoneSpectrumStore";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { AudioManager } from "react-native-audio-api";

const isRecordingInitialized = async () => {
  const status = await AudioManager.checkRecordingPermissions();
  return status === "Granted";
};

const initRecording = async () => {
  if (!(await isRecordingInitialized())) {
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== "Granted") {
      Alert.alert("Permission to access microphone was denied", undefined, [
        { text: "OK" },
        {
          text: "Open settings",
          onPress: () => {
            Linking.openSettings();
          },
        },
      ]);
      return false;
    }
  }

  AudioManager.setAudioSessionOptions({
    iosCategory: "playAndRecord",
    iosMode: "measurement",
  });

  const sessionActivated = await AudioManager.setAudioSessionActivity(true);
  if (!sessionActivated) {
    Alert.alert("Could not activate audio session.");
    return false;
  }

  return true;
};

export function useSoundLevelMeter() {
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const {
    start,
    stop,
    disconnect,
    configureSpectrum,
    disposeSpectrum,
    configureAudioMetrics,
    disposeAudioMetrics,
    isRunning,
    isStarting,
    isStopping,
    isDisconnecting,
    elapsedSeconds,
    dbfs,
    peakHz,
    bars,
    error,
  } = useMicrophoneSpectrumStore();

  useEffect(() => {
    return () => {
      disposeSpectrum();
      disposeAudioMetrics();
      void disconnect();
    };
  }, [disposeSpectrum, disposeAudioMetrics, disconnect]);

  const startRecording = useCallback(async () => {
    setIsPreparingRecording(true);

    try {
      const canRecord = await initRecording();
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
      void stop();
      return;
    }

    void startRecording();
  }, [isRunning, startRecording, stop]);

  const isBusy =
    isPreparingRecording || isStarting || isStopping || isDisconnecting;

  const buttonTitle = isPreparingRecording || isStarting
    ? "Starting..."
    : isStopping
      ? "Stopping..."
      : isRunning
        ? "Stop"
        : "Record";

  return {
    bars,
    buttonTitle,
    dbfs,
    elapsedSeconds,
    error,
    isBusy,
    isRunning,
    isStarting,
    peakHz,
    toggleRecording,
  };
}
