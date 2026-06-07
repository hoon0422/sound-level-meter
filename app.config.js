const agentName = process.env.EXPO_AGENT_NAME || process.env.AGENT_NAME || '';
const appEnvironment = process.env.APP_ENV || process.env.EAS_BUILD_PROFILE || 'development';
const sentryOrganization = process.env.SENTRY_ORG || 'yh-sil-sound-meter';
const sentryProject = process.env.SENTRY_PROJECT || 'sound-level-meter';
const enableSentryInDev = process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === 'true';

const readSampleRate = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
};
const microphonePermissionMessage = require('./locales/en.json').permissions.micMessage;

module.exports = {
  expo: {
    name: process.env.APP_DISPLAY_NAME || 'sound-level-meter',
    slug: 'sound-level-meter',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: process.env.EXPO_SCHEME || 'soundlevelmeter',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER || 'com.sunnyinnolab.decibella2',
      infoPlist: {
        NSMicrophoneUsageDescription: microphonePermissionMessage,
        CFBundleAllowMixedLocalizations: true,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
      ],
      package: process.env.ANDROID_PACKAGE || 'com.sunnyinnolab.decibella2',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      './plugins/withLocalizedMicrophonePermissions',
      './plugins/withIosSettingsBundle',
      [
        '@sentry/react-native/expo',
        {
          organization: sentryOrganization,
          project: sentryProject,
        },
      ],
      [
        'react-native-audio-api',
        {
          iosMicrophonePermission: microphonePermissionMessage,
          androidPermissions: [
            'android.permission.RECORD_AUDIO',
            'android.permission.MODIFY_AUDIO_SETTINGS',
          ],
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: process.env.ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.ADMOB_IOS_APP_ID,
          optimizeInitialization: true,
          optimizeAdLoading: true,
        },
      ],
      [
        'expo-localization',
        {
          supportedLocales: {
            ios: ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'fr', 'es'],
            android: ['en', 'ko', 'ja', 'zh-rCN', 'zh-rTW', 'fr', 'es'],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appEnvironment,
      agentName,
      amplitude: {
        apiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '',
      },
      sentry: {
        dsn:
          process.env.EXPO_PUBLIC_SENTRY_DSN ||
          'https://d0315ec2938cdade7fd57a030b9b291e@o4511522000142336.ingest.us.sentry.io/4511522001059840',
        enabled: enableSentryInDev || ['preview', 'production'].includes(appEnvironment),
        enableInDev: enableSentryInDev,
        tracesSampleRate: readSampleRate(
          process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
          appEnvironment === 'preview' ? 1 : 0.2
        ),
      },
      adMob: {
        rewardedAdUnitIds: {
          android: process.env.ADMOB_ANDROID_REWARDED_AD_UNIT_ID || '',
          ios: process.env.ADMOB_IOS_REWARDED_AD_UNIT_ID || '',
        },
      },
      router: {},
      eas: {
        projectId: 'fb9855b4-962b-4ef4-8939-83af8cd3b259',
      },
    },
  },
};
