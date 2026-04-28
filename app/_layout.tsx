import { Tabs, useRouter } from 'expo-router';
import { Image, Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

// Apply DM Sans as the default font for all Text components
const AnyText = Text as any;
AnyText.defaultProps = AnyText.defaultProps ?? {};
AnyText.defaultProps.style = { fontFamily: 'DMSans_400Regular' };

function Decibella() {
  return <Image source={require('./assets/icons/decibella.png')} style={{ height: 24, width: 120, marginLeft: 16 }} resizeMode="contain" />;
}

function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => router.push('/settings')} style={{ paddingRight: 16 }}>
      <Image source={require('./assets/icons/setting.png')} style={{ height: 24, width: 24, tintColor: colors.text }} resizeMode="contain" />
    </TouchableOpacity>
  );
}

function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerLeft: () => <Decibella />,
        headerRight: () => <SettingsButton />,
        tabBarActiveTintColor: colors.primary,
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium' },
      }}
    >
      <Tabs.Screen
        name="db-time"
        options={{
          title: 'dB/Time',
          tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/graph.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'dB/Freq',
          tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/bar.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
        }}
      />
      <Tabs.Screen
        name="sound-guide"
        options={{
          title: 'Sound Guide',
          tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/book.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/log.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
        }}
      />
      <Tabs.Screen name="record" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <TabLayout />
    </ThemeProvider>
  );
}
