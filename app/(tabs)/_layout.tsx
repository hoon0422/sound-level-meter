import { APP_ANALYTICS_EVENTS, type AppAnalyticsEvent, trackAppEvent } from '@/analytics/events';
import {
  captureSentryException,
  getSentryErrorAttributes,
  logSentryError,
  markSentryInteraction,
} from '@/analytics/sentry';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { useAdAccess } from '@/context/AdAccessContext';
import { useTheme } from '@/context/ThemeContext';
import { useRecordingAppLifecycle } from '@/hooks/useRecordingAppLifecycle';
import { useRecordingLogger } from '@/hooks/useRecordingLogger';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, InteractionManager, TouchableOpacity } from 'react-native';

function trackTabInteraction(eventType: AppAnalyticsEvent, target: string, gated: boolean, hasAccess?: boolean) {
  InteractionManager.runAfterInteractions(() => {
    trackAppEvent(eventType);
    markSentryInteraction('Tab button pressed', {
      target,
      gated,
      ...(hasAccess === undefined ? {} : { hasAccess }),
    });
  });
}

function Decibella() {
  const { logo } = useTheme();
  return <Image source={logo} style={{ height: 24, width: 120, marginLeft: 16 }} resizeMode="contain" />;
}

function SettingsButton() {
  const router = useRouter();
  const { colors } = useTheme();
  const openSettings = () => {
    trackAppEvent(APP_ANALYTICS_EVENTS.settingClicked);
    markSentryInteraction('Settings button pressed', {
      target: 'settings',
    });
    router.push('/settings');
  };

  return (
    <TouchableOpacity onPress={openSettings} style={{ paddingRight: 16 }}>
      <Image
        source={require('@/assets/icons/setting.png')}
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
  useRecordingAppLifecycle();

  useEffect(() => {
    connect(DEFAULT_CONFIG).catch(error => {
      logSentryError('Initial microphone connect failed', getSentryErrorAttributes(error));
      captureSentryException(error, 'Initial microphone connect failed');
    });
    return () => {
      disconnect().catch(error => {
        logSentryError('Microphone disconnect during tab cleanup failed', getSentryErrorAttributes(error));
        captureSentryException(error, 'Microphone disconnect during tab cleanup failed');
      });
    };
  }, [connect, disconnect]);

  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { ensureAccess, hasAccess } = useAdAccess();

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        freezeOnBlur: true,
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
        listeners={{
          tabPress: () => {
            trackTabInteraction(APP_ANALYTICS_EVENTS.dbTimeClicked, 'db-time', false);
          },
        }}
        options={{
          title: t('tabs.dbTime'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/icons/graph.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="db-freq"
        listeners={{
          tabPress: () => {
            trackTabInteraction(APP_ANALYTICS_EVENTS.fqButtonClicked, 'db-freq', false);
          },
        }}
        options={{
          title: t('tabs.dbFreq'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/icons/chart.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sound-guide"
        listeners={{
          tabPress: event => {
            trackTabInteraction(APP_ANALYTICS_EVENTS.gdButtonClicked, 'sound-guide', true, hasAccess);

            if (hasAccess) {
              return;
            }

            event.preventDefault();
            ensureAccess('soundGuide', () => router.push('/sound-guide'));
          },
        }}
        options={{
          title: t('tabs.soundGuide'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/icons/book.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        listeners={{
          tabPress: event => {
            trackTabInteraction(APP_ANALYTICS_EVENTS.recordButtonClicked, 'log', true, hasAccess);

            if (hasAccess) {
              return;
            }

            event.preventDefault();
            ensureAccess('log', () => router.push('/log'));
          },
        }}
        options={{
          title: t('tabs.log'),
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/icons/list.png')}
              style={{ height: size, width: size, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
