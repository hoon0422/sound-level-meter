const agentName = process.env.EXPO_AGENT_NAME || process.env.AGENT_NAME || '';

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
      ],
      package: process.env.ANDROID_PACKAGE || 'com.sunnyinnolab.decibella2',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'react-native-audio-api',
        {
          iosMicrophonePermission: 'This app needs microphone access for audio analysis.',
          androidPermissions: ['android.permission.RECORD_AUDIO'],
        },
      ],
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      agentName,
      router: {},
      eas: {
        projectId: 'fb9855b4-962b-4ef4-8939-83af8cd3b259',
      },
    },
  },
};
