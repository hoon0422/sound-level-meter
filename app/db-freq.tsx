import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useAudioStore from "@/store/audioStore";
import { useRecording } from "@/context/RecordingContext";

const OFFSET = 90;

export default function DbFreqScreen() {
  const { metering, isRecording } = useAudioStore();
  const { startRecording, stopRecording } = useRecording();

  const dbDisplay =
    metering !== undefined ? `${(metering + OFFSET).toFixed(1)} dB` : "— dB";

  return (
    <View style={styles.page}>
      <Text style={styles.dbText}>{dbDisplay}</Text>
      <View style={styles.comingSoonBox}>
        <Text style={styles.comingSoonTitle}>dB/Frequency</Text>
        <Text style={styles.comingSoonSubtitle}>Coming Soon</Text>
      </View>
      <TouchableOpacity
        style={[styles.micButton, isRecording && styles.micButtonRecording]}
        onPress={() => (isRecording ? stopRecording() : startRecording())}
        activeOpacity={0.8}
      >
        <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#fff" />
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
  comingSoonBox: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 40,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  comingSoonSubtitle: {
    fontSize: 15,
    color: "#8e8e93",
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
