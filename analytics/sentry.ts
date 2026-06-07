import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import type { ComponentType } from 'react';

type SentryExtraConfig = {
  dsn?: string;
  enableInDev?: boolean;
  enabled?: boolean;
  tracesSampleRate?: number;
};

type ExpoExtraConfig = {
  appEnvironment?: string;
  sentry?: SentryExtraConfig;
};

type SentryAttributeValue = string | number | boolean | null | undefined;
type SentryAttributes = Record<string, SentryAttributeValue>;
type SentrySpanAttributes = Record<string, string | number | boolean | undefined>;

const extra = Constants.expoConfig?.extra as ExpoExtraConfig | undefined;
const sentryConfig = extra?.sentry;
const appEnvironment = extra?.appEnvironment ?? 'development';
const isSentryEnabled =
  (!__DEV__ || sentryConfig?.enableInDev === true) && sentryConfig?.enabled === true && Boolean(sentryConfig.dsn);
const isExpoGo = isRunningInExpoGo();
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isExpoGo,
});

let initialized = false;

function compactAttributes(attributes: SentryAttributes = {}) {
  return Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined));
}

function compactSpanAttributes(attributes: SentryAttributes = {}): SentrySpanAttributes {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined && value !== null)
  ) as SentrySpanAttributes;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '[Unserializable]';
  }
}

function truncate(value: string, maxLength = 2000) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function readObjectField(error: unknown, field: string): unknown {
  if (typeof error !== 'object' || error === null || !(field in error)) {
    return undefined;
  }

  return (error as Record<string, unknown>)[field];
}

function toAttributeValue(value: unknown): SentryAttributeValue {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return truncate(safeStringify(value));
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;

  const message = readObjectField(error, 'message');
  return typeof message === 'string' && message.trim().length > 0 ? message : fallbackMessage;
}

function normalizeException(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error;
  }

  const message = getErrorMessage(error, fallbackMessage);
  const normalizedError = new Error(message);
  normalizedError.name = 'NonErrorException';
  return normalizedError;
}

function describeNonErrorException(error: unknown) {
  if (error instanceof Error) return undefined;

  if (typeof error === 'object' && error !== null) {
    return {
      thrownType: 'object',
      thrownValue: JSON.stringify(error),
    };
  }

  return {
    thrownType: typeof error,
    thrownValue: String(error),
  };
}

export function getSentryErrorAttributes(error: unknown, prefix = 'error'): SentryAttributes {
  const attributes: SentryAttributes = {
    [`${prefix}.type`]: typeof error,
  };

  if (error instanceof Error) {
    attributes[`${prefix}.name`] = error.name;
    attributes[`${prefix}.message`] = error.message;
    attributes[`${prefix}.stack`] = error.stack;
    attributes[`${prefix}.cause`] = toAttributeValue(error.cause);
  }

  if (typeof error === 'object' && error !== null) {
    const errorObject = error as Record<string, unknown>;
    attributes[`${prefix}.constructor`] = error.constructor?.name;
    attributes[`${prefix}.keys`] = Object.keys(errorObject).join(',');
    attributes[`${prefix}.code`] = toAttributeValue(errorObject.code);
    attributes[`${prefix}.domain`] = toAttributeValue(errorObject.domain);
    attributes[`${prefix}.namespace`] = toAttributeValue(errorObject.namespace);
    attributes[`${prefix}.jsStack`] = toAttributeValue(errorObject.jsStack);
    attributes[`${prefix}.userInfo`] = toAttributeValue(errorObject.userInfo);

    const userInfo = errorObject.userInfo;
    if (typeof userInfo === 'object' && userInfo !== null) {
      const userInfoObject = userInfo as Record<string, unknown>;
      attributes[`${prefix}.userInfo.code`] = toAttributeValue(userInfoObject.code);
      attributes[`${prefix}.userInfo.message`] = toAttributeValue(userInfoObject.message);
    }

    attributes[`${prefix}.serialized`] = truncate(safeStringify(errorObject));
  } else if (!(error instanceof Error)) {
    attributes[`${prefix}.value`] = toAttributeValue(error);
  }

  return compactAttributes(attributes);
}

export function getSentryErrorMessage(error: unknown, fallbackMessage: string) {
  return getErrorMessage(error, fallbackMessage);
}

export function initializeSentry() {
  if (!isSentryEnabled || initialized) return;

  Sentry.init({
    dsn: sentryConfig?.dsn,
    environment: appEnvironment,
    tracesSampleRate: sentryConfig?.tracesSampleRate ?? 0.2,
    profilesSampleRate: 0,
    enableNativeFramesTracking: !isExpoGo,
    enableStallTracking: true,
    enableUserInteractionTracing: true,

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Attach a masked screenshot when an error event is captured.
    attachScreenshot: true,
    screenshot: {
      maskAllText: false,
      maskAllImages: true,
    },

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [navigationIntegration, Sentry.mobileReplayIntegration()],
  });

  Sentry.setTag('app_environment', appEnvironment);
  Sentry.setTag('expo_go', String(isExpoGo));
  initialized = true;
}

export function registerSentryNavigationContainer(ref: unknown) {
  if (!isSentryEnabled || !ref) return;

  navigationIntegration.registerNavigationContainer(ref);
}

export function wrapWithSentryRoot(Component: ComponentType<any>): ComponentType<any> {
  return isSentryEnabled ? Sentry.wrap(Component) : Component;
}

export function addSentryBreadcrumb(message: string, attributes?: SentryAttributes) {
  if (!isSentryEnabled) return;

  Sentry.addBreadcrumb({
    category: 'app',
    level: 'info',
    message,
    data: compactAttributes(attributes),
  });
}

type SentryTraceOptions = {
  attributes?: SentryAttributes;
  forceTransaction?: boolean;
  name: string;
  op?: string;
};

export function traceSentrySpan<T>(options: SentryTraceOptions, callback: () => T): T {
  if (!isSentryEnabled) return callback();

  return Sentry.startSpan(
    {
      name: options.name,
      op: options.op,
      forceTransaction: options.forceTransaction,
      attributes: compactSpanAttributes(options.attributes),
    },
    callback
  );
}

export function markSentryInteraction(name: string, attributes?: SentryAttributes) {
  if (!isSentryEnabled) return;

  addSentryBreadcrumb(name, attributes);

  Sentry.startSpan(
    {
      name,
      op: 'ui.action',
      forceTransaction: true,
      attributes: compactSpanAttributes(attributes),
    },
    () => undefined
  );
}

export function logSentryInfo(message: string, attributes?: SentryAttributes) {
  if (!isSentryEnabled) return;

  Sentry.logger.info(message, compactAttributes(attributes));
}

export function logSentryWarning(message: string, attributes?: SentryAttributes) {
  if (!isSentryEnabled) return;

  Sentry.logger.warn(message, compactAttributes(attributes));
}

export function logSentryError(message: string, attributes?: SentryAttributes) {
  if (!isSentryEnabled) return;

  Sentry.logger.error(message, compactAttributes(attributes));
}

export function captureSentryException(error: unknown, fallbackMessage: string, attributes?: SentryAttributes) {
  if (!isSentryEnabled) return;

  const normalizedError = normalizeException(error, fallbackMessage);
  const nonErrorException = describeNonErrorException(error);

  Sentry.withScope(scope => {
    scope.setContext('app_error_context', {
      ...getSentryErrorAttributes(error),
      ...compactAttributes(attributes),
    });

    if (nonErrorException) {
      scope.setContext('non_error_exception', nonErrorException);
    }

    Sentry.captureException(normalizedError);
  });
}
