import { DEFAULT_CONFIG } from "@/audio/constants";
import { CALIBRATION_PEAK_DBFS } from "@/audio/engine";
import { SPECTRUM_BANDS } from "@/audio/spectrum";
import { useMicrophoneSpectrumStore } from "@/stores/useMicrophoneSpectrumStore";
import { memo, useCallback, useEffect } from "react";
import { Alert, Button, Linking, StyleSheet, Text, View } from "react-native";
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

const BAR_HEIGHT = 180;
const MIN_DB = 10;
const MAX_DB = 90;
const DB_RANGE = MAX_DB - MIN_DB;
const DB_GRID_LINES = [20, 40, 60, 80];

function dbToY(db: number) {
  return ((db - MIN_DB) / DB_RANGE) * BAR_HEIGHT;
}

function calibrate(dbfs: number) {
  return dbfs + CALIBRATION_PEAK_DBFS;
}

function dbToHeight(db: number) {
  return Math.max(2, ((Math.max(db, MIN_DB) - MIN_DB) / DB_RANGE) * BAR_HEIGHT);
}

function meterColorDb(db: number) {
  if (db < 40) return "#4caf50";
  if (db < 70) return "#ff9800";
  return "#f44336";
}

const SpectrumBars = memo(function SpectrumBars({ bars }: { bars: number[] }) {
  return (
    <View style={styles.spectrumContainer}>
      <View style={styles.spectrumChart}>
        {/* dB axis labels */}
        <View style={styles.dbAxis}>
          {DB_GRID_LINES.map(db => (
            <Text key={db} style={[styles.dbLabel, { bottom: dbToY(db) - 6 }]}>
              {db}
            </Text>
          ))}
        </View>

        {/* Chart area with grid + bars */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {DB_GRID_LINES.map(db => (
            <View key={db} style={[styles.gridLine, { bottom: dbToY(db) }]} />
          ))}

          {/* Bars */}
          <View style={styles.barsRow}>
            {bars.map((rawDbfs, index) => {
              const db = calibrate(rawDbfs);
              return (
                <View
                  key={index}
                  style={[
                    styles.bar,
                    {
                      height: dbToHeight(db),
                      backgroundColor: meterColorDb(db),
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* Frequency labels */}
      <View style={styles.freqLabelsRow}>
        <View style={styles.dbAxisSpacer} />
        <View style={styles.freqLabelsInner}>
          {SPECTRUM_BANDS.map((band, index) => (
            <Text key={index} style={styles.freqLabel}>
              {band.label}
            </Text>
          ))}
        </View>
      </View>
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
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  spectrumChart: {
    flexDirection: "row",
    width: "100%",
  },
  dbAxis: {
    width: 30,
    height: BAR_HEIGHT,
    position: "relative",
  },
  dbAxisSpacer: {
    width: 30,
  },
  dbLabel: {
    position: "absolute",
    right: 4,
    fontSize: 9,
    color: "#999",
  },
  chartArea: {
    flex: 1,
    height: BAR_HEIGHT,
    position: "relative",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  barsRow: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingHorizontal: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
  freqLabelsRow: {
    flexDirection: "row",
    width: "100%",
  },
  freqLabelsInner: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  freqLabel: {
    flex: 1,
    fontSize: 9,
    color: "#999",
    textAlign: "center",
  },
  statsText: {
    fontSize: 30,
  },
});
