import {
  AudioModule,
  RecordingOptions,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect } from "react";
import { Alert, Button, Linking, StyleSheet, Text, View } from "react-native";

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
  const audioRecorder = useAudioRecorder(MeteringRecordingOptions);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    initRecording();
  }, []);

  const record = async () => {
    if (!(await isRecordingInitialized())) {
      const result = await initRecording();
      if (!result) {
        return;
      }
    }
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
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
    paddingBlock: 40,
    paddingInline: 20,
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
  dbText: {
    fontSize: 30,
  },
});
