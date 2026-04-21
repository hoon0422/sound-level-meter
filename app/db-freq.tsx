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
    backgroundColor: "#FEFAEE",
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
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: "#333333",
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  micButtonRecording: {
    backgroundColor: "#cc3300",
  },
});
