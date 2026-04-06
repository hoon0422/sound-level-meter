import {
  AudioModule,
  RecordingOptions,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect, useState } from "react";
import { Alert, Button, Linking, StyleSheet, Text, View } from "react-native";

import AnalysisGraph from "@/components/AnalysisGraph";
import SoundGraph from "@/components/SoundGraph";
import useAudioStore from "@/store/audioStore";

const MeteringRecordingOptions: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

const OFFSET = 90;

const isRecordingInitialized = async () => {
  const status = await AudioModule.getRecordingPermissionsAsync();
  return status.granted;
};

const initRecording = async () => {
  if (await isRecordingInitialized()) {
    return;
  }

  const status = await AudioModule.requestRecordingPermissionsAsync();
  if (!status.granted) {
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

  setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    allowsBackgroundRecording: true,
  });
  return true;
};

export default function App() {
  const { setIsRecording, setMetering, clearSamples, setRecordingStartTime, addLog, samples, recordingStartTime } = useAudioStore();

  const audioRecorder = useAudioRecorder(MeteringRecordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isGraph, setIsGraph] = useState(true);
  const [isFreq, setIsFreq] = useState(true);

  useEffect(() => {
    initRecording();
  }, []);

  useEffect(() => {
    setIsRecording(recorderState.isRecording);
    setMetering(recorderState.metering);
  }, [recorderState.isRecording, recorderState.metering]);

  const record = async () => {
    if (!(await isRecordingInitialized())) {
      const result = await initRecording();
      if (!result) {
        return;
      }
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

    if (samples.length === 0) return;

    const now = new Date();
    const startMs = recordingStartTime ?? samples[0].timestamp;
    const endMs = samples[samples.length - 1].timestamp;
    const durationMs = endMs - startMs;

    const durationSec = Math.floor(durationMs / 1000);
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
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: durationStr,
      maxDb: parseFloat(maxDb.toFixed(1)),
      minDb: parseFloat(minDb.toFixed(1)),
      avgDb: parseFloat(avgDb.toFixed(1)),
    });
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        {recorderState.metering === undefined ? (
          <Text style={styles.dbText}>Press record</Text>
        ) : (
          <Text style={styles.dbText}>
            {(recorderState.metering + OFFSET).toFixed(2)}dB
          </Text>
        )}
        {isGraph ? <SoundGraph /> : <AnalysisGraph />}
        <View style={styles.buttonRow}>
          {/* Graph Mode Toggle */}
          <Button
            title={isGraph ? "Analysis" : "Graph"}
            onPress={() => setIsGraph(!isGraph)}
          />

          {/* Record Button */}
          <Button
            title={recorderState.isRecording ? "Stop" : "Record"}
            onPress={() => {
              if (recorderState.isRecording) {
                stopRecording();
              } else {
                record();
              }
            }}
          />

          <Button
            title={isFreq ? "dB" : "Hz"}
            onPress={() => setIsFreq(!isFreq)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBlock: 20,
    paddingInline: 10,
  },
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: "red",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  dbText: {
    fontSize: 30,
  },
});
