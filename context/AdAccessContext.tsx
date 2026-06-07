import {
  addSentryBreadcrumb,
  captureSentryException,
  getSentryErrorAttributes,
  getSentryErrorMessage,
  logSentryError,
  logSentryInfo,
  logSentryWarning,
} from '@/analytics/sentry';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import mobileAds, { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// const ACCESS_DURATION_MS = 2 * 60 * 60 * 1000;
const ACCESS_DURATION_MS = 120 * 1000;
const ACCESS_UNTIL_KEY = 'ad-access-until';

type AdAccessReason = 'measurement' | 'soundGuide' | 'log';

type AdAccessContextType = {
  accessUntil: number;
  hasAccess: boolean;
  ensureAccess: (reason: AdAccessReason, onGranted?: () => void) => boolean;
};

const AdAccessContext = createContext<AdAccessContextType>({
  accessUntil: 0,
  hasAccess: false,
  ensureAccess: () => false,
});

type ExpoExtra = {
  adMob?: {
    rewardedAdUnitIds?: {
      android?: string;
      ios?: string;
    };
  };
};

function getRewardedAdUnitId() {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const configuredUnitId =
    Platform.OS === 'ios' ? extra?.adMob?.rewardedAdUnitIds?.ios : extra?.adMob?.rewardedAdUnitIds?.android;

  return configuredUnitId || TestIds.REWARDED;
}

export function AdAccessProvider({ children }: { children: React.ReactNode }) {
  const { colors, themeName } = useTheme();
  const { t } = useTranslation();
  const [accessUntil, setAccessUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [promptReason, setPromptReason] = useState<AdAccessReason | null>(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [adCycle, setAdCycle] = useState(0);
  const pendingGrantActionRef = useRef<(() => void) | undefined>(undefined);
  const rewardedAdRef = useRef<RewardedAd | null>(null);
  const adLoadedRef = useRef(false);
  const didEarnRewardRef = useRef(false);
  const shouldShowWhenLoadedRef = useRef(false);

  const hasAccess = accessUntil > now;

  const showRewardedAd = useCallback((rewardedAd: RewardedAd, source: string) => {
    rewardedAd.show({ immersiveModeEnabled: true }).catch(error => {
      const message = getSentryErrorMessage(error, 'Failed to show rewarded ad');
      logSentryError('Rewarded ad show failed', {
        source,
        ...getSentryErrorAttributes(error),
      });
      captureSentryException(error, 'Failed to show rewarded ad', {
        source,
      });
      setIsAdLoading(false);
      setAdError(message);
    });
  }, []);

  const grantAccess = useCallback(() => {
    const nextAccessUntil = Date.now() + ACCESS_DURATION_MS;
    setAccessUntil(nextAccessUntil);
    AsyncStorage.setItem(ACCESS_UNTIL_KEY, String(nextAccessUntil)).catch(error => {
      logSentryWarning('Failed to persist ad access grant', getSentryErrorAttributes(error));
      captureSentryException(error, 'Failed to persist ad access grant');
    });
    setPromptReason(null);
    setAdError(null);

    const onGranted = pendingGrantActionRef.current;
    pendingGrantActionRef.current = undefined;
    onGranted?.();
  }, []);

  const loadRewardedAd = useCallback(() => {
    const rewardedAd = rewardedAdRef.current;
    if (!rewardedAd || adLoadedRef.current) {
      return;
    }

    setIsAdLoading(true);
    setAdError(null);
    rewardedAd.load();
  }, []);

  useEffect(() => {
    mobileAds()
      .initialize()
      .catch(error => {
        logSentryWarning('Google Mobile Ads initialization failed', getSentryErrorAttributes(error));
        captureSentryException(error, 'Google Mobile Ads initialization failed');
      });

    const storedAccess = async () => {
      const stored = await AsyncStorage.getItem(ACCESS_UNTIL_KEY);
      const parsedAccessUntil = stored ? Number(stored) : 0;
      if (Number.isFinite(parsedAccessUntil) && parsedAccessUntil > Date.now()) {
        setAccessUntil(parsedAccessUntil);
      }
    };

    storedAccess().catch(error => {
      logSentryWarning('Failed to restore ad access grant', getSentryErrorAttributes(error));
      captureSentryException(error, 'Failed to restore ad access grant');
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const rewardedAd = RewardedAd.createForAdRequest(getRewardedAdUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedAdRef.current = rewardedAd;
    adLoadedRef.current = false;
    didEarnRewardRef.current = false;

    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      adLoadedRef.current = true;
      setIsAdLoading(false);
      setAdError(null);

      if (shouldShowWhenLoadedRef.current) {
        shouldShowWhenLoadedRef.current = false;
        showRewardedAd(rewardedAd, 'loaded_event');
      }
    });

    const unsubscribeEarnedReward = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      addSentryBreadcrumb('Rewarded ad reward earned');
      didEarnRewardRef.current = true;
    });

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      const didEarnReward = didEarnRewardRef.current;
      adLoadedRef.current = false;
      didEarnRewardRef.current = false;
      shouldShowWhenLoadedRef.current = false;
      setIsAdLoading(false);
      setAdCycle(cycle => cycle + 1);

      if (didEarnReward) {
        logSentryInfo('Rewarded ad completed');
        setImmediate(() => {
          grantAccess();
        });
      }
    });

    const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, error => {
      const adUnitId = getRewardedAdUnitId();
      logSentryWarning('Rewarded ad error', {
        ...getSentryErrorAttributes(error),
        adUnitId,
      });
      captureSentryException(error, 'Rewarded ad error', {
        adUnitId,
      });
      adLoadedRef.current = false;
      didEarnRewardRef.current = false;
      shouldShowWhenLoadedRef.current = false;
      setIsAdLoading(false);
      setAdError(getSentryErrorMessage(error, t('adAccess.error')));
    });

    rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarnedReward();
      unsubscribeClosed();
      unsubscribeError();
      rewardedAd.removeAllListeners();
    };
  }, [adCycle, grantAccess, showRewardedAd, t]);

  const ensureAccess = useCallback(
    (reason: AdAccessReason, onGranted?: () => void) => {
      if (accessUntil > Date.now()) {
        onGranted?.();
        return true;
      }

      pendingGrantActionRef.current = onGranted;
      setPromptReason(reason);
      return false;
    },
    [accessUntil]
  );

  const handleWatchAd = () => {
    const rewardedAd = rewardedAdRef.current;
    if (!rewardedAd) {
      logSentryWarning('Rewarded ad unavailable when user requested access');
      setAdError(t('adAccess.error'));
      return;
    }

    if (adLoadedRef.current) {
      addSentryBreadcrumb('Rewarded ad show requested', {
        state: 'loaded',
      });
      adLoadedRef.current = false;
      setAdError(null);
      showRewardedAd(rewardedAd, 'watch_button');
      return;
    }

    shouldShowWhenLoadedRef.current = true;
    addSentryBreadcrumb('Rewarded ad load requested', {
      state: 'not_loaded',
    });
    loadRewardedAd();
  };

  const handleClosePrompt = () => {
    pendingGrantActionRef.current = undefined;
    shouldShowWhenLoadedRef.current = false;
    setPromptReason(null);
    setAdError(null);
  };

  const contextValue = useMemo(
    () => ({
      accessUntil,
      hasAccess,
      ensureAccess,
    }),
    [accessUntil, ensureAccess, hasAccess]
  );

  return (
    <AdAccessContext.Provider value={contextValue}>
      {children}
      <Modal visible={promptReason !== null} transparent animationType="fade" onRequestClose={handleClosePrompt}>
        <View style={styles.backdrop}>
          <View
            style={[
              styles.dialog,
              {
                backgroundColor: colors.surface,
                borderColor: themeName === 'dark' ? colors.inactive : colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Pressable
              accessibilityLabel="Close ad prompt"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleClosePrompt}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <View style={[styles.badge, { backgroundColor: colors.soundGuideSlot, borderColor: colors.border }]}>
              <Text style={styles.badgeIcon}>AD</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('adAccess.title')}</Text>
            <View style={[styles.benefits, { borderColor: colors.divider }]}>
              <Text style={[styles.benefitText, { color: colors.text }]}>{t('adAccess.benefits.measurement')}</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>{t('adAccess.benefits.soundGuide')}</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>{t('adAccess.benefits.log')}</Text>
            </View>
            {adError && <Text style={[styles.errorText, { color: colors.loud }]}>{t('adAccess.error')}</Text>}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleWatchAd}
                disabled={isAdLoading}
                style={[styles.primaryButton, { backgroundColor: colors.primary, borderColor: colors.border }]}
              >
                {isAdLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('adAccess.watchAd')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AdAccessContext.Provider>
  );
}

export function useAdAccess() {
  return useContext(AdAccessContext);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.46)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    paddingTop: 28,
    gap: 12,
    position: 'relative',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  benefits: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
