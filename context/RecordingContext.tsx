import React, { createContext, useContext, useEffect } from "react";
import { Alert, Linking } from "react-native";
import {
  AudioModule,
  RecordingOptions,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import useAudioStore from "@/store/audioStore";

const OFFSET = 90;
const DB_MIN = 0;
const DB_MAX = 100;

const MeteringRecordingOptions: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

const isPermissionGranted = async () => {
  const status = await AudioModule.getRecordingPermissionsAsync();
  return status.granted;
};

const requestPermission = async () => {
  if (await isPermissionGranted()) return true;
  const status = await AudioModule.requestRecordingPermissionsAsync();
  if (!status.granted) {
    Alert.alert("Permission to access microphone was denied", undefined, [
      { text: "OK" },
      { text: "Open settings", onPress: () => Linking.openSettings() },
    ]);
    return false;
  }
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    allowsBackgroundRecording: true,
  });
  return true;
};

type RecordingContextType = {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
};

const RecordingContext = createContext<RecordingContextType>({
  startRecording: async () => {},
  stopRecording: async () => {},
});

export function useRecording() {
  return useContext(RecordingContext);
}

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const { setIsRecording, setMetering, clearSamples, setRecordingStartTime, addLog, addSample } =
    useAudioStore();

  const audioRecorder = useAudioRecorder(MeteringRecordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    setIsRecording(recorderState.isRecording);
    setMetering(recorderState.metering);
  }, [recorderState.isRecording, recorderState.metering]);

  // Collect samples whenever metering updates during recording
  useEffect(() => {
    if (!recorderState.isRecording) return;
    if (recorderState.metering === undefined || recorderState.metering === null) return;
    addSample({
      db: Math.min(DB_MAX, Math.max(DB_MIN, recorderState.metering + OFFSET)),
      timestamp: Date.now(),
    });
  }, [recorderState.metering]);

  const startRecording = async () => {
    if (!(await isPermissionGranted())) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      allowsBackgroundRecording: true,
    });
    clearSamples();
    setRecordingStartTime(Date.now());
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    await audioRecorder.stop();

    const { samples, recordingStartTime } = useAudioStore.getState();
    if (samples.length === 0) return;

    const now = new Date();
    const startMs = recordingStartTime ?? samples[0].timestamp;
    const endMs = samples[samples.length - 1].timestamp;
    const durationMs = endMs - startMs;
    const durationSec = Math.floor(durationMs / 1000);
    const durationMin = Math.floor(durationSec / 60);
    const durationRemSec = durationSec % 60;
    const durationStr =
      durationMin > 0 ? `${durationMin}m ${durationRemSec}s` : `${durationRemSec}s`;

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
  };

  return (
    <RecordingContext.Provider value={{ startRecording, stopRecording }}>
      {children}
    </RecordingContext.Provider>
  );
}
