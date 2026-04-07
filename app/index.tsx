import { useMicrophoneSpectrum } from "@/hooks/useMicrophoneSpectrum";
import { useCallback, useEffect } from "react";
import { Alert, Button, Linking, StyleSheet, Text, View } from "react-native";
import { AudioManager } from "react-native-audio-api";

// const OFFSET = 90;

const isRecordingInitialized = async () => {
  const status = await AudioManager.checkRecordingPermissions();
  return status === "Granted";
};

const initRecording = async () => {
  if (await isRecordingInitialized()) {
    return;
  }

  const status = await AudioManager.requestRecordingPermissions();
  if (status === "Granted") {
    return true;
  }

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
};
function meterColor(value: number) {
  if (value < 0.33) return "#4caf50";
  if (value < 0.66) return "#ff9800";
  return "#f44336";
}

export default function App() {
  const { start, stop, isRunning, dbfs, peakHz, bars, error } =
    useMicrophoneSpectrum({
      fftSize: 1024,
      barCount: 32,
      uiFps: 20,
      minHz: 0,
      maxHz: 20000,
      noiseFloorDbfs: -65,
      barSmoothingAlpha: 0.2,
      sampleRate: 44100,
      smoothingTimeConstant: 0.3,
    });

  useEffect(() => {
    initRecording();
  }, []);

  const record = useCallback(async () => {
    if (!(await isRecordingInitialized())) {
      const result = await initRecording();
      if (!result) {
        return;
      }
    }
    await start();
  }, [start]);

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        {isRunning ? (
          <View style={{ width: "100%", alignItems: "center" }}>
            <View style={styles.statsContainer}>
              <Text>dBFS: {dbfs.toFixed(1)}</Text>
              {error ? <Text style={{ color: "#ff6b6b" }}>{error}</Text> : null}
              <Text>
                Peak Frequency:{" "}
                {peakHz != null ? `${peakHz.toFixed(0)} Hz` : "—"}
              </Text>
            </View>
            <View style={styles.spectrumContainer}>
              <View
                style={{
                  height: 180,
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 2,
                }}>
                {bars.map((value, index) => (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                      height: Math.max(2, value * 180),
                      backgroundColor: meterColor(value),
                      borderRadius: 2,
                    }}
                  />
                ))}
              </View>
              <Text>Spectrum</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.statsText}>Press record</Text>
        )}
        <Button
          title={isRunning ? "Stop" : "Record"}
          onPress={() => {
            if (isRunning) {
              stop();
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
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 24,
    backgroundColor: "#FEFAEE",
  },
  dbText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#4A4A4A",
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: "#333333",
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  statsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spectrumContainer: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statsText: {
    fontSize: 30,
  },
});
