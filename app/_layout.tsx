import { DEFAULT_CONFIG } from '@/audio/constants';
import { useRecordingLogger } from '@/hooks/useRecordingLogger';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => router.push('/settings')} style={{ paddingRight: 16 }}>
      <Ionicons name="settings-outline" size={22} color={colors.text} />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  const { connect, disconnect } = useAudioMeterStore(state => ({
    connect: state.connect,
    disconnect: state.disconnect,
  }));
  useRecordingLogger();

  useEffect(() => {
    void connect(DEFAULT_CONFIG);
    return () => {
      void disconnect();
    };
  }, [connect, disconnect]);

  const { colors } = useTheme();
  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginLeft: 16, color: colors.primary }}>DECIBELLA</Text>
          ),
          headerRight: () => <SettingsButton />,
          tabBarActiveTintColor: colors.primary,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides the tab from the bottom bar
        }}
      />
        <Tabs.Screen
          name="db-time"
          options={{
            title: 'dB/Time',
            tabBarIcon: ({ color, size }) => <Ionicons name="pulse-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="db-freq"
          options={{
            title: 'dB/Freq',
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="sound-guide"
          options={{
            title: 'Sound Guide',
            tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen name="record" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
      </Tabs>
    </ThemeProvider>
  );
}
