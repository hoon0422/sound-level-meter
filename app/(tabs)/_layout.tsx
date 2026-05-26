import { DEFAULT_CONFIG } from '@/audio/constants';
import { useTheme } from '@/context/ThemeContext';
import { useRecordingLogger } from '@/hooks/useRecordingLogger';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, TouchableOpacity } from 'react-native';

function Decibella() {
  const { logo } = useTheme();
  return <Image source={logo} style={{ height: 24, width: 120, marginLeft: 16 }} resizeMode="contain" />;
}

function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={() => router.push('/settings')} style={{ paddingRight: 16 }}>
      <Image
        source={require('../assets/icons/setting.png')}
        style={{ height: 24, width: 24, tintColor: colors.text }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          alignItems: 'center',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          shadowOffset: { width: 2, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium' },
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
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/graph.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="db-freq"
        options={{
          title: t('tabs.dbFreq'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/chart.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sound-guide"
        options={{
          title: t('tabs.soundGuide'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/book.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: t('tabs.log'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../assets/icons/list.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
