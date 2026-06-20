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
import { ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

type PendingRewardedAdShow = {
  rewardedAd: RewardedAd;
  source: string;
  fallbackTimer: ReturnType<typeof setTimeout> | null;
};

function getRewardedAdUnitId() {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const configuredUnitId =
    Platform.OS === 'ios' ? extra?.adMob?.rewardedAdUnitIds?.ios : extra?.adMob?.rewardedAdUnitIds?.android;

  return configuredUnitId || TestIds.REWARDED;
}

export function AdAccessProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [accessUntil, setAccessUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [promptReason, setPromptReason] = useState<AdAccessReason | null>(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isMobileAdsReady, setIsMobileAdsReady] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [adCycle, setAdCycle] = useState(0);
  const pendingGrantActionRef = useRef<(() => void) | undefined>(undefined);
  const rewardedAdRef = useRef<RewardedAd | null>(null);
  const adLoadedRef = useRef(false);
  const didEarnRewardRef = useRef(false);
  const shouldShowWhenLoadedRef = useRef(false);
  const adRequestReasonRef = useRef<AdAccessReason | null>(null);
  const pendingRewardedAdShowRef = useRef<PendingRewardedAdShow | null>(null);

  const hasAccess = accessUntil > now;

  const presentRewardedAd = useCallback((rewardedAd: RewardedAd, source: string) => {
    requestAnimationFrame(() => {
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
        setPromptReason(adRequestReasonRef.current);
      });
    });
  }, []);

  const flushPendingRewardedAdShow = useCallback(() => {
    const pendingShow = pendingRewardedAdShowRef.current;
    if (!pendingShow) {
      return;
    }

    pendingRewardedAdShowRef.current = null;
    if (pendingShow.fallbackTimer) {
      clearTimeout(pendingShow.fallbackTimer);
    }
    setTimeout(
      () => {
        presentRewardedAd(pendingShow.rewardedAd, pendingShow.source);
      },
      Platform.OS === 'ios' ? 100 : 0
    );
  }, [presentRewardedAd]);

  const showRewardedAd = useCallback(
    (rewardedAd: RewardedAd, source: string) => {
      if (pendingRewardedAdShowRef.current?.fallbackTimer) {
        clearTimeout(pendingRewardedAdShowRef.current.fallbackTimer);
      }
      setIsAdLoading(false);
      setAdError(null);
      setPromptReason(null);

      pendingRewardedAdShowRef.current = {
        rewardedAd,
        source,
        fallbackTimer: Platform.OS === 'ios' ? null : setTimeout(flushPendingRewardedAdShow, 0),
      };
    },
    [flushPendingRewardedAdShow]
  );

  const grantAccess = useCallback(() => {
    const nextAccessUntil = Date.now() + ACCESS_DURATION_MS;
    setAccessUntil(nextAccessUntil);
    AsyncStorage.setItem(ACCESS_UNTIL_KEY, String(nextAccessUntil)).catch(error => {
      logSentryWarning('Failed to persist ad access grant', getSentryErrorAttributes(error));
      captureSentryException(error, 'Failed to persist ad access grant');
    });
    setPromptReason(null);
    setAdError(null);
    adRequestReasonRef.current = null;

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
    let isMounted = true;

    async function initializeMobileAds() {
      try {
        await mobileAds().setRequestConfiguration({
          testDeviceIdentifiers: ['EMULATOR'],
        });
        await mobileAds().initialize();
        if (isMounted) {
          setIsMobileAdsReady(true);
        }
      } catch (error) {
        const errorAttributes = getSentryErrorAttributes(error);
        logSentryWarning('Google Mobile Ads initialization failed', errorAttributes);
        captureSentryException(error, 'Google Mobile Ads initialization failed');
      }
    }

    initializeMobileAds();

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

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isMobileAdsReady) {
      return;
    }

    const rewardedAd = RewardedAd.createForAdRequest(getRewardedAdUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedAdRef.current = rewardedAd;
    adLoadedRef.current = false;
    didEarnRewardRef.current = false;

    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      adLoadedRef.current = true;
      setAdError(null);

      if (shouldShowWhenLoadedRef.current) {
        shouldShowWhenLoadedRef.current = false;
        showRewardedAd(rewardedAd, 'loaded_event');
      } else {
        setIsAdLoading(false);
      }
    });

    const unsubscribeOpened = rewardedAd.addAdEventListener(AdEventType.OPENED, () => {
      setIsAdLoading(false);
      setPromptReason(null);
      setAdError(null);
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
      adRequestReasonRef.current = null;
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
      const errorAttributes = getSentryErrorAttributes(error);
      logSentryWarning('Rewarded ad error', {
        ...errorAttributes,
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
      setPromptReason(adRequestReasonRef.current);
    });

    rewardedAd.load();

    return () => {
      const pendingShow = pendingRewardedAdShowRef.current;
      if (pendingShow?.rewardedAd === rewardedAd) {
        if (pendingShow.fallbackTimer) {
          clearTimeout(pendingShow.fallbackTimer);
        }
        pendingRewardedAdShowRef.current = null;
      }
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeEarnedReward();
      unsubscribeClosed();
      unsubscribeError();
      rewardedAd.removeAllListeners();
    };
  }, [adCycle, grantAccess, isMobileAdsReady, showRewardedAd, t]);

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
      adRequestReasonRef.current = promptReason;
      setAdError(null);
      setIsAdLoading(true);
      showRewardedAd(rewardedAd, 'watch_button');
      return;
    }

    shouldShowWhenLoadedRef.current = true;
    adRequestReasonRef.current = promptReason;
    addSentryBreadcrumb('Rewarded ad load requested', {
      state: 'not_loaded',
    });
    setAdError(null);
    loadRewardedAd();
  };

  const handleClosePrompt = () => {
    pendingGrantActionRef.current = undefined;
    shouldShowWhenLoadedRef.current = false;
    adRequestReasonRef.current = null;
    if (pendingRewardedAdShowRef.current?.fallbackTimer) {
      clearTimeout(pendingRewardedAdShowRef.current.fallbackTimer);
    }
    pendingRewardedAdShowRef.current = null;
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
      <Modal
        visible={promptReason !== null}
        transparent
        animationType="fade"
        onDismiss={flushPendingRewardedAdShow}
        onRequestClose={handleClosePrompt}
      >
        <View style={styles.backdrop}>
          <View style={[styles.dialog, { shadowColor: colors.shadow }]}>
            <View style={styles.hero}>
              <Image source={require('@/assets/icons/decibella.png')} resizeMode="contain" style={styles.logo} />
              <Text style={styles.title}>{t('adAccess.title')}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close ad prompt"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleClosePrompt}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#333333" />
            </Pressable>
            <View style={styles.body}>
              <View style={styles.benefits}>
                <View style={styles.benefit}>
                  <Text style={styles.benefitBullet}>-</Text>
                  <Text style={styles.benefitText}>{t('adAccess.benefits.measurement')}</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitBullet}>-</Text>
                  <Text style={styles.benefitText}>{t('adAccess.benefits.soundGuide')}</Text>
                </View>
                <View style={styles.benefit}>
                  <Text style={styles.benefitBullet}>-</Text>
                  <Text style={styles.benefitText}>{t('adAccess.benefits.log')}</Text>
                </View>
              </View>
              {adError && <Text style={[styles.errorText, { color: colors.loud }]}>{t('adAccess.error')}</Text>}
              <Pressable
                accessibilityRole="button"
                onPress={handleWatchAd}
                disabled={isAdLoading}
                style={[styles.primaryButton, isAdLoading && styles.primaryButtonDisabled]}
              >
                {isAdLoading ? (
                  <ActivityIndicator color="#333333" />
                ) : (
                  <View style={styles.primaryButtonContent}>
                    <Ionicons name="play" size={24} color="#333333" />
                    <Text style={styles.primaryButtonText}>{t('adAccess.watchAd')}</Text>
                  </View>
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
    maxWidth: 350,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#FEFAEE',
    paddingHorizontal: 27,
    paddingTop: 48,
    paddingBottom: 20,
    gap: 18,
  },
  logo: {
    width: 158,
    height: 37,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 13,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#FDFCFA',
    zIndex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    color: '#333333',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
  },
  body: {
    width: '100%',
    paddingHorizontal: 27,
    paddingTop: 27,
    paddingBottom: 37,
    gap: 13,
  },
  benefits: {
    alignSelf: 'stretch',
    minHeight: 100,
    justifyContent: 'center',
    backgroundColor: '#FDFCFA',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 5,
    shadowColor: '#333333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
  },
  benefitBullet: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  benefitText: {
    flex: 1,
    color: '#333333',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  primaryButton: {
    alignSelf: 'stretch',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    borderColor: '#333333',
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#333333',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  primaryButtonDisabled: {
    opacity: 0.72,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#333333',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'DMSans_700Bold',
  },
});
