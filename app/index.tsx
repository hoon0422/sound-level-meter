import { DEFAULT_CONFIG } from "@/audio/constants";
import { useMicrophoneSpectrumStore } from "@/stores/useMicrophoneSpectrumStore";
import { memo, useCallback, useEffect } from "react";
import { Alert, Button, Linking, StyleSheet, Text, View } from "react-native";
import { AudioManager } from "react-native-audio-api";

// const OFFSET = 90;

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

function meterColor(value: number) {
  if (value < 0.33) return "#4caf50";
  if (value < 0.66) return "#ff9800";
  return "#f44336";
}

export default function App() {
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

  const isBusy = isStarting || isStopping || isDisconnecting;

  useEffect(() => {
    initRecording();
  }, []);

  useEffect(() => {
    return () => {
      disposeSpectrum();
      disposeAudioMetrics();
      void disconnect();
    };
  }, [disposeSpectrum, disposeAudioMetrics, disconnect]);

  const record = useCallback(async () => {
    const result = await initRecording();
    if (!result) {
      return;
    }
    configureSpectrum(DEFAULT_CONFIG);
    configureAudioMetrics(DEFAULT_CONFIG);
    await start(DEFAULT_CONFIG);
  }, [configureSpectrum, configureAudioMetrics, start]);

  const buttonTitle = isStarting
    ? "Starting..."
    : isStopping
      ? "Stopping..."
      : isRunning
        ? "Stop"
        : "Record";

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        {isRunning ? (
          <View style={styles.content}>
            <StatsPanel
              elapsedSeconds={elapsedSeconds}
              dbfs={dbfs}
              peakHz={peakHz}
              error={error}
            />
            <SpectrumBars bars={bars} />
          </View>
        ) : (
          <Text style={styles.statsText}>
            {isStarting ? "Starting..." : "Press record"}
          </Text>
        )}
        <Button
          title={buttonTitle}
          disabled={isBusy}
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

const StatsPanel = memo(function StatsPanel({
  elapsedSeconds,
  dbfs,
  peakHz,
  error,
}: {
  elapsedSeconds: number;
  dbfs: number;
  peakHz: number | null;
  error: string | null;
}) {
  return (
    <View style={styles.statsContainer}>
      <Text>Elapsed: {elapsedSeconds.toFixed(2)} s</Text>
      <Text>dBFS: {dbfs.toFixed(1)}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text>
        Peak Frequency: {peakHz != null ? `${peakHz.toFixed(0)} Hz` : "—"}
      </Text>
    </View>
  );
});

const SpectrumBars = memo(function SpectrumBars({ bars }: { bars: number[] }) {
  return (
    <View style={styles.spectrumContainer}>
      <View style={styles.barsRow}>
        {bars.map((value, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: Math.max(2, value * 180),
                backgroundColor: meterColor(value),
              },
            ]}
          />
        ))}
      </View>
      <Text>Spectrum</Text>
    </View>
  );
});

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
  content: {
    width: "100%",
    alignItems: "center",
  },
  statsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    color: "#ff6b6b",
  },
  spectrumContainer: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  barsRow: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
  statsText: {
    fontSize: 30,
  },
});
