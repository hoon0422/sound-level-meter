import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import mobileAds, { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const ACCESS_DURATION_MS = 2 * 60 * 60 * 1000;
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
  const pendingGrantActionRef = useRef<(() => void) | undefined>(undefined);
  const rewardedAdRef = useRef<RewardedAd | null>(null);
  const adLoadedRef = useRef(false);
  const shouldShowWhenLoadedRef = useRef(false);

  const hasAccess = accessUntil > now;

  const grantAccess = useCallback(() => {
    const nextAccessUntil = Date.now() + ACCESS_DURATION_MS;
    setAccessUntil(nextAccessUntil);
    void AsyncStorage.setItem(ACCESS_UNTIL_KEY, String(nextAccessUntil));
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
    void mobileAds().initialize();

    const storedAccess = async () => {
      const stored = await AsyncStorage.getItem(ACCESS_UNTIL_KEY);
      const parsedAccessUntil = stored ? Number(stored) : 0;
      if (Number.isFinite(parsedAccessUntil) && parsedAccessUntil > Date.now()) {
        setAccessUntil(parsedAccessUntil);
      }
    };

    void storedAccess();
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

    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      adLoadedRef.current = true;
      setIsAdLoading(false);
      setAdError(null);

      if (shouldShowWhenLoadedRef.current) {
        shouldShowWhenLoadedRef.current = false;
        void rewardedAd.show({ immersiveModeEnabled: true });
      }
    });

    const unsubscribeEarnedReward = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, grantAccess);

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      adLoadedRef.current = false;
      shouldShowWhenLoadedRef.current = false;
      setIsAdLoading(false);
      rewardedAd.load();
    });

    const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, error => {
      adLoadedRef.current = false;
      shouldShowWhenLoadedRef.current = false;
      setIsAdLoading(false);
      setAdError(error.message);
    });

    rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarnedReward();
      unsubscribeClosed();
      unsubscribeError();
      rewardedAd.removeAllListeners();
    };
  }, [grantAccess]);

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
      setAdError(t('adAccess.error'));
      return;
    }

    if (adLoadedRef.current) {
      adLoadedRef.current = false;
      setAdError(null);
      void rewardedAd.show({ immersiveModeEnabled: true });
      return;
    }

    shouldShowWhenLoadedRef.current = true;
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
            <View style={[styles.badge, { backgroundColor: colors.soundGuideSlot, borderColor: colors.border }]}>
              <Text style={styles.badgeIcon}>AD</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('adAccess.title')}</Text>
            <Text style={[styles.message, { color: colors.mutedText }]}>
              {promptReason ? t(`adAccess.reasons.${promptReason}`) : ''}
            </Text>
            <View style={[styles.benefits, { borderColor: colors.divider }]}>
              <Text style={[styles.benefitText, { color: colors.text }]}>{t('adAccess.benefits.measurement')}</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>{t('adAccess.benefits.soundGuide')}</Text>
              <Text style={[styles.benefitText, { color: colors.text }]}>{t('adAccess.benefits.log')}</Text>
            </View>
            {adError && <Text style={[styles.errorText, { color: colors.loud }]}>{t('adAccess.error')}</Text>}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleClosePrompt}
                style={[styles.secondaryButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{t('adAccess.notNow')}</Text>
              </Pressable>
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
    gap: 12,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
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
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
