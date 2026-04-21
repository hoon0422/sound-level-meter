import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpectrumBars } from "@/components/SpectrumBars";
import { useSoundLevelMeter } from "@/hooks/useSoundLevelMeter";
import { StatsPanel } from "@/components/StatsPanel";

export default function DbFreqScreen() {
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
  
  const dbDisplay = isRunning ? `${dbfs.toFixed(1)} dB` : "— dB";

  return (
    <View style={styles.page}>
      <Text style={styles.dbText}>{dbDisplay}</Text>
        <View>
          <StatsPanel
            elapsedSeconds={elapsedSeconds}
            dbfs={dbfs}
            peakHz={peakHz}
            error={error}
          />
          <SpectrumBars bars={bars} />
        </View>

      <TouchableOpacity
        style={[styles.micButton, isRunning && styles.micButtonRecording]}
        onPress={toggleRecording}
        disabled={isBusy}
        activeOpacity={0.8}
      >
        <Ionicons name={isRunning ? "stop" : "mic"} size={32} color="#fff" />
      </TouchableOpacity>
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
    backgroundColor: "#f2f2f7",
  },
  dbText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#000",
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  micButtonRecording: {
    backgroundColor: "#cc3300",
  },
});
