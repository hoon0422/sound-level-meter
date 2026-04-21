import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SoundGraph from "@/components/SoundGraph";
import useAudioStore from "@/store/audioStore";
import { useRecording } from "@/context/RecordingContext";

const OFFSET = 90;

export default function DbTimeScreen() {
  const { metering, isRecording } = useAudioStore();
  const { startRecording, stopRecording } = useRecording();

  const dbDisplay = `${(metering !== undefined ? metering + OFFSET : 0).toFixed(1)} dB`;

  return (
    <View style={styles.page}>
      <Text style={styles.dbText}>{dbDisplay}</Text>
      <SoundGraph />
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
  micButtonRecording: {
    backgroundColor: "#cc3300",
  },
});
