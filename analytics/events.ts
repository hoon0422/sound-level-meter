import Constants from 'expo-constants';
import { init, track } from '@amplitude/analytics-react-native';
import { addSentryBreadcrumb } from './sentry';

export const APP_ANALYTICS_EVENTS = {
  startButtonClicked: 'Start_button_clicked',
  stopButtonClicked: 'Stop_button_clicked',
  dbTimeClicked: 'dB_Time_clicked',
  fqButtonClicked: 'Fq_button_clicked',
  gdButtonClicked: 'Gd_button_clicked',
  recordButtonClicked: 'Record_button_clicked',
  settingClicked: 'Setting_clicked',
} as const;

export type AppAnalyticsEvent = (typeof APP_ANALYTICS_EVENTS)[keyof typeof APP_ANALYTICS_EVENTS];

type AmplitudeExtraConfig = {
  apiKey?: string;
};

const analyticsEnvironment = __DEV__ ? 'development' : 'production';
let initialized = false;

function getAmplitudeConfig() {
  return Constants.expoConfig?.extra?.amplitude as AmplitudeExtraConfig | undefined;
}

function getAmplitudeApiKey() {
  return getAmplitudeConfig()?.apiKey;
}

export function initializeAnalytics() {
  if (initialized) return;

  const apiKey = getAmplitudeApiKey();
  if (!apiKey) return;

  init(apiKey, undefined, {
    trackingSessionEvents: true,
  });
  initialized = true;
}

export function trackAppEvent(eventType: AppAnalyticsEvent) {
  addSentryBreadcrumb(eventType, {
    app_environment: analyticsEnvironment,
  });

  if (!initialized) initializeAnalytics();
  if (!initialized) return;

  track(eventType, {
    app_environment: analyticsEnvironment,
  });
}
