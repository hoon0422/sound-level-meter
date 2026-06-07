const agentName = process.env.EXPO_AGENT_NAME || process.env.AGENT_NAME || '';
const appEnvironment = process.env.APP_ENV || process.env.EAS_BUILD_PROFILE || 'development';
const sentryOrganization = process.env.SENTRY_ORG || 'yh-sil-sound-meter';
const sentryProject = process.env.SENTRY_PROJECT || 'sound-level-meter';
const microphonePermissionMessage =
  'This app requires microphone access to measure and display real-time ambient sound levels. Audio data is used only for decibel calculation and is never recorded or stored.';

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
        UIBackgroundModes: ['audio'],
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
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        'android.permission.POST_NOTIFICATIONS',
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
          iosBackgroundMode: true,
          androidPermissions: [
            'android.permission.RECORD_AUDIO',
            'android.permission.FOREGROUND_SERVICE',
            'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
            'android.permission.FOREGROUND_SERVICE_MICROPHONE',
            'android.permission.POST_NOTIFICATIONS',
          ],
          androidForegroundService: true,
          androidFSTypes: ['mediaPlayback', 'microphone'],
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
        enabled: ['preview', 'production'].includes(appEnvironment),
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
