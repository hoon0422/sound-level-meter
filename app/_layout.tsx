import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";
import { RecordingProvider } from "@/context/RecordingContext";

function SettingsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/settings")}
      style={{ paddingRight: 16 }}
    >
      <Ionicons name="settings-outline" size={22} color="#000" />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <RecordingProvider>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <Text style={{ fontSize: 18, fontWeight: "bold", marginLeft: 16 }}>
              DECIBELLA
            </Text>
          ),
          headerRight: () => <SettingsButton />,
          tabBarActiveTintColor: "#007AFF",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "dB/Time",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pulse-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="db-freq"
          options={{
            title: "dB/Freq",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sound-guide"
          options={{
            title: "Sound Guide",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: "Log",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="record" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
      </Tabs>
    </RecordingProvider>
  );
}
