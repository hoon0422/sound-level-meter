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
import { Tabs, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, InteractionManager, StyleSheet, TouchableOpacity, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_MIN_BOTTOM_PADDING = 24;

export const unstable_settings = {
  anchor: 'db-time',
};

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
  return <Image source={logo} style={styles.logo} resizeMode="contain" />;
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
    <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
      <Image
        source={require('@/assets/icons/setting.png')}
        style={[styles.settingsIcon, { tintColor: colors.text }]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

type TabConfig = {
  eventType: AppAnalyticsEvent;
  gated: boolean;
  gateReason?: 'soundGuide' | 'log';
  href: Href;
  icon: ImageSourcePropType;
  label: string;
  name: string;
  target: string;
};

type TabPressEvent = {
  preventDefault: () => void;
};

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

  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { ensureAccess, hasAccess } = useAdAccess();
  const tabConfigs: TabConfig[] = [
    {
      eventType: APP_ANALYTICS_EVENTS.dbTimeClicked,
      gated: false,
      href: '/db-time',
      icon: require('@/assets/icons/graph.png') as ImageSourcePropType,
      label: t('tabs.dbTime'),
      name: 'db-time',
      target: 'db-time',
    },
    {
      eventType: APP_ANALYTICS_EVENTS.fqButtonClicked,
      gated: false,
      href: '/db-freq',
      icon: require('@/assets/icons/chart.png') as ImageSourcePropType,
      label: t('tabs.dbFreq'),
      name: 'db-freq',
      target: 'db-freq',
    },
    {
      eventType: APP_ANALYTICS_EVENTS.gdButtonClicked,
      gated: true,
      gateReason: 'soundGuide',
      href: '/sound-guide',
      icon: require('@/assets/icons/book.png') as ImageSourcePropType,
      label: t('tabs.soundGuide'),
      name: 'sound-guide',
      target: 'sound-guide',
    },
    {
      eventType: APP_ANALYTICS_EVENTS.recordButtonClicked,
      gated: true,
      gateReason: 'log',
      href: '/log',
      icon: require('@/assets/icons/list.png') as ImageSourcePropType,
      label: t('tabs.log'),
      name: 'log',
      target: 'log',
    },
  ];

  const createTabListeners = (config: TabConfig) => ({
    tabPress: (event: TabPressEvent) => {
      trackTabInteraction(config.eventType, config.target, config.gated, config.gated ? hasAccess : undefined);

      if (config.gated && !hasAccess && config.gateReason) {
        event.preventDefault();
        ensureAccess(config.gateReason, () => router.push(config.href));
      }
    },
  });

  return (
    <Tabs
      initialRouteName="db-time"
      screenOptions={{
        headerLeft: () => <Decibella />,
        headerRight: () => <SettingsButton />,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitle: '',
        headerLeftContainerStyle: styles.headerLeft,
        headerRightContainerStyle: styles.headerRight,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING),
            shadowColor: colors.shadow,
          },
        ],
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      {tabConfigs.map(config => (
        <Tabs.Screen
          key={config.name}
          name={config.name}
          listeners={createTabListeners(config)}
          options={{
            title: config.label,
            tabBarIcon: ({ color }) => (
              <Image source={config.icon} style={[styles.tabIcon, { tintColor: color }]} resizeMode="contain" />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    paddingLeft: 16,
  },
  headerRight: {
    paddingRight: 16,
  },
  logo: {
    height: 24,
    width: 120,
  },
  settingsButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  settingsIcon: {
    height: 24,
    width: 24,
  },
  tabBar: {
    borderRadius: 10,
    borderTopWidth: 1,
    borderWidth: 1,
    height: 82,
    paddingTop: 10,
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tabItem: {
    minHeight: 48,
    paddingVertical: 0,
  },
  tabIcon: {
    height: 24,
    width: 24,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
});
