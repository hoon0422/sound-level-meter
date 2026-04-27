import { DEFAULT_CONFIG } from "@/audio/constants";
import { useMicrophoneSpectrumStore } from "@/stores/useMicrophoneSpectrumStore";
import useLogsStore from "@/store/logsStore";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const { addLog } = useLogsStore();
  const samplesRef = useRef<Array<{ db: number; timestamp: number }>>([]);
  const startTimeRef = useRef<number | null>(null);
  const prevIsRunningRef = useRef(false);

  // Accumulate samples while recording
  useEffect(() => {
    if (isRunning && dbfs > 0) {
      samplesRef.current.push({ db: dbfs, timestamp: Date.now() });
    }
  }, [dbfs, isRunning]);

  // Detect start/stop transitions to save log
  useEffect(() => {
    if (isRunning && !prevIsRunningRef.current) {
      samplesRef.current = [];
      startTimeRef.current = Date.now();
    } else if (!isRunning && prevIsRunningRef.current) {
      const samples = samplesRef.current;
      if (samples.length > 0) {
        const now = new Date();
        const startMs = startTimeRef.current ?? samples[0].timestamp;
        const endMs = samples[samples.length - 1].timestamp;
        const durationSec = Math.floor((endMs - startMs) / 1000);
        const durationMin = Math.floor(durationSec / 60);
        const durationRemSec = durationSec % 60;
        const durationStr =
          durationMin > 0
            ? `${durationMin}m ${durationRemSec}s`
            : `${durationRemSec}s`;
        const dbValues = samples.map((s) => s.db);
        const maxDb = Math.max(...dbValues);
        const minDb = Math.min(...dbValues);
        const avgDb = dbValues.reduce((a, b) => a + b, 0) / dbValues.length;
        addLog({
          id: `${now.getTime()}`,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          duration: durationStr,
          maxDb: parseFloat(maxDb.toFixed(1)),
          minDb: parseFloat(minDb.toFixed(1)),
          avgDb: parseFloat(avgDb.toFixed(1)),
        });
      }
      samplesRef.current = [];
      startTimeRef.current = null;
    }
    prevIsRunningRef.current = isRunning;
  }, [isRunning, addLog]);

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
