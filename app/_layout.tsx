import { DEFAULT_CONFIG } from '@/audio/constants';
import { useRecordingLogger } from '@/hooks/useRecordingLogger';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Tabs, useRouter } from 'expo-router';
import { Image, Text, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';
import '@/i18n';

SplashScreen.preventAutoHideAsync();

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

function AppLayout() {
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
  const { t } = useTranslation();

  return (
    <Tabs
          screenOptions={{
            headerShown: true,
            headerTitle: '',
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerLeft: () => <Decibella />,
            headerRight: () => <SettingsButton />,
            tabBarActiveTintColor: colors.primary, tabBarLabelStyle: { fontFamily: 'DMSans_500Medium' },
          }}
        >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
          <Tabs.Screen
            name="db-time"
            options={{
              title: t('tabs.dbTime'),
              tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/graph.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
            }}
          />
          <Tabs.Screen
            name="db-freq"
            options={{
              title: t('tabs.dbFreq'),
              tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/chart.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
            }}
          />
          <Tabs.Screen
            name="sound-guide"
            options={{
              title: t('tabs.soundGuide'),
              tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/book.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
            }}
          />
          <Tabs.Screen
            name="log"
            options={{
              title: t('tabs.log'),
              tabBarIcon: ({ color, size }) => <Image source={require('./assets/icons/list.png')} style={{ height: size, width: size, tintColor: color }} resizeMode="contain" />,
            }}
          />
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
      <LanguageProvider>
        <AppLayout />
      </LanguageProvider>
    </ThemeProvider>
  );
}
