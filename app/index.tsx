import { SpectrumBars } from "@/components/SpectrumBars";
import { StatsPanel } from "@/components/StatsPanel";
import { useSoundLevelMeter } from "@/hooks/useSoundLevelMeter";
import { Button, StyleSheet, Text, View } from "react-native";

export default function App() {
  const {
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
  } = useSoundLevelMeter();

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
          onPress={toggleRecording}
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
  content: {
    width: "100%",
    alignItems: "center",
  },
  statsText: {
    fontSize: 30,
  },
});
