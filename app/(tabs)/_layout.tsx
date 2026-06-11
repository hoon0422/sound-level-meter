import { APP_ANALYTICS_EVENTS, type AppAnalyticsEvent, trackAppEvent } from '@/analytics/events';
import {
  captureSentryException,
  getSentryErrorAttributes,
  logSentryError,
  markSentryInteraction,
} from '@/analytics/sentry';
import { DEFAULT_CONFIG } from '@/audio/constants';
import GraphsLayout from '@/components/GraphTabLayout';
import { useAdAccess } from '@/context/AdAccessContext';
import { useTheme } from '@/context/ThemeContext';
import { useRecordingAppLifecycle } from '@/hooks/useRecordingAppLifecycle';
import { useRecordingLogger } from '@/hooks/useRecordingLogger';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import { useRouter, type Href } from 'expo-router';
import { TabList, TabTrigger, useTabTrigger, useTabsWithChildren } from 'expo-router/ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GRAPH_TAB_NAMES = new Set(['db-time', 'db-freq', 'sound-guide']);
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

type TabBarItemConfig = {
  eventType: AppAnalyticsEvent;
  gated: boolean;
  gateReason?: 'soundGuide' | 'log';
  href: Href;
  icon: ImageSourcePropType;
  label: string;
  name: string;
  target: string;
};

function TabBarItem({ config, hasAccess }: { config: TabBarItemConfig; hasAccess: boolean }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { ensureAccess } = useAdAccess();
  const { switchTab, trigger } = useTabTrigger({ name: config.name });
  const isFocused = Boolean(trigger?.isFocused);
  const color = isFocused ? colors.primary : colors.inactive;

  const handlePress = () => {
    trackTabInteraction(config.eventType, config.target, config.gated, config.gated ? hasAccess : undefined);

    if (config.gated && !hasAccess && config.gateReason) {
      ensureAccess(config.gateReason, () => router.push(config.href));
      return;
    }

    switchTab(config.name, { reset: 'onFocus' });
  };

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onPress={handlePress}
      style={styles.tabItem}
    >
      <Image source={config.icon} style={[styles.tabIcon, { tintColor: color }]} resizeMode="contain" />
      <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {config.label}
      </Text>
    </Pressable>
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
  const insets = useSafeAreaInsets();
  const { hasAccess } = useAdAccess();
  const tabBarItems: TabBarItemConfig[] = [
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
  const tabTriggers = (
    <TabList>
      {tabBarItems.map(item => (
        <TabTrigger key={item.name} name={item.name} href={item.href} />
      ))}
    </TabList>
  );
  const { state, descriptors, NavigationContent } = useTabsWithChildren({
    children: tabTriggers,
    initialRouteName: 'db-time',
  });
  const activeRoute = state.routes[state.index];
  const activeDescriptor = activeRoute ? descriptors[activeRoute.key] : undefined;
  const activeContent = activeDescriptor?.render() ?? null;
  const isGraphTab = activeRoute ? GRAPH_TAB_NAMES.has(activeRoute.name) : false;

  return (
    <NavigationContent>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <Decibella />
          <SettingsButton />
        </View>

        <View style={styles.content}>{isGraphTab ? <GraphsLayout>{activeContent}</GraphsLayout> : activeContent}</View>

        <View
          style={[
            styles.tabBar,
            {
              paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING),
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          {tabBarItems.map(item => (
            <TabBarItem key={item.name} config={item} hasAccess={hasAccess} />
          ))}
        </View>
      </View>
    </NavigationContent>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 88,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: 24,
    width: 120,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    height: 24,
    width: 24,
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    borderRadius: 10,
    borderWidth: 1,
    paddingTop: 10,
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tabItem: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
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
