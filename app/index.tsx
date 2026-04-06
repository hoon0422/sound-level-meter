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

const toPercent = (value: number): `${number}%` => {
  return `${Math.round(value * 100)}%`;
};

export default function App() {
  const {
    start,
    stop,
    isRunning,
    dbfs,
    peakHz,
    bars,
    bass,
    mid,
    treble,
    error,
  } = useMicrophoneSpectrum({
    fftSize: 4096,
    barCount: 32,
    uiFps: 30,
    minHz: 80,
    maxHz: 500,
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
          <View>
            <View style={styles.statsContainer}>
              <Text style={{ fontSize: 16 }}>dBFS: {dbfs.toFixed(1)}</Text>
              {error ? (
                <Text style={{ color: "#ff6b6b", marginTop: 8 }}>{error}</Text>
              ) : null}
              <Text style={{ fontSize: 16, marginTop: 6 }}>
                Peak Frequency:{" "}
                {peakHz != null ? `${peakHz.toFixed(0)} Hz` : "—"}
              </Text>
            </View>
            <View style={{ marginTop: 20 }}>
              <Text style={{ marginBottom: 8 }}>Spectrum</Text>
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
            </View>
            <View style={{ marginTop: 24, gap: 12 }}>
              <Text style={{ color: "white" }}>
                Bass: {(bass * 100).toFixed(0)}%
              </Text>
              <View
                style={{
                  height: 10,
                  backgroundColor: "#333",
                  borderRadius: 999,
                }}>
                <View
                  style={{
                    width: toPercent(bass),
                    height: 10,
                    backgroundColor: meterColor(bass),
                    borderRadius: 999,
                  }}
                />
              </View>

              <Text style={{ color: "white" }}>
                Mid: {(mid * 100).toFixed(0)}%
              </Text>
              <View
                style={{
                  height: 10,
                  backgroundColor: "#333",
                  borderRadius: 999,
                }}>
                <View
                  style={{
                    width: toPercent(mid),
                    height: 10,
                    backgroundColor: meterColor(mid),
                    borderRadius: 999,
                  }}
                />
              </View>

              <Text style={{ color: "white" }}>
                Treble: {(treble * 100).toFixed(0)}%
              </Text>
              <View
                style={{
                  height: 10,
                  backgroundColor: "#333",
                  borderRadius: 999,
                }}>
                <View
                  style={{
                    width: toPercent(treble),
                    height: 10,
                    backgroundColor: meterColor(treble),
                    borderRadius: 999,
                  }}
                />
              </View>
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
  statsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  statsText: {
    fontSize: 30,
  },
});
