import { StyleSheet, Text, View } from "react-native";

export default function LogScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.placeholder}>Log</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    fontSize: 24,
    color: "#888",
  },
});
