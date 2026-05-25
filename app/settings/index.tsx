import React, { useState, useMemo } from 'react';
import {
  Image,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage, type LanguageCode } from '@/context/LanguageContext';
import { navigateBackFromSettings } from '@/navigation/settings';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

const APP_VERSION = '1.0';

const LANGUAGE_OPTIONS: { label: string; value: LanguageCode }[] = [
  { label: 'English', value: 'en' },
  { label: '한국어', value: 'ko' },
  { label: '日本語', value: 'ja' },
  { label: '中文 (简体)', value: 'zh-CN' },
  { label: '中文 (繁體)', value: 'zh-TW' },
  { label: 'Français', value: 'fr' },
  { label: 'Español', value: 'es' },
];

export default function SettingsPage() {
  const { colors: themeColors, themeName, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();
  const isDark = themeName === 'dark';
  const theme = themeName;

  const colors = useMemo(
    () => ({
      background: themeColors.background,
      text: themeColors.text,
      primary: themeColors.primary,
      border: themeColors.border,
      divider: themeColors.divider,
      surface: themeColors.surface,

      link: themeColors.text,
      arrows: themeColors.primary,
    }),
    [themeColors]
  );

  const updateTheme = (val: 'Dark' | 'Light') => setTheme(val === 'Dark' ? 'dark' : 'light');

  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const insets = useSafeAreaInsets();

  const handleLinkPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert(t('settings.linkErrorTitle'), error.message);
    }
  };

  const dynamicStyles = useMemo(() => {
    const basePadding = isTablet ? 40 : 20;
    const headerPaddingTop = insets.top + 8;
    const headerFontSize = isTablet ? 32 : 24;
    const labelFontSize = isTablet ? 18 : 16;
    const valueFontSize = isTablet ? 18 : 16;
    const themeOptionFontSize = isTablet ? 16 : 14;
    const languageOptionFontSize = isTablet ? 17 : 15;
    const versionFontSize = isTablet ? 18 : 16;
    const subLabelFontSize = isTablet ? 14 : 12;

    const sunnyBannerPadding = isTablet ? 20 : Math.min(screenWidth * 0.05, 15);
    const sunnyBannerGap = isTablet ? 16 : Math.max(screenWidth * 0.02, 8);
    const sunnyBannerFontSize = isTablet ? 14 : Math.max(screenWidth * 0.035, 11);
    const sunnyBannerLogoWidth = isTablet ? 120 : Math.min(screenWidth * 0.25, 100); // 화면 너비의 25% 또는 최대 100px

    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: headerPaddingTop,
        paddingBottom: isTablet ? 25 : 20,
        paddingHorizontal: basePadding,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTitle: {
        fontSize: headerFontSize,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1,
      },
      settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: basePadding,
        paddingVertical: isTablet ? 20 : 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      selectedItem: {
        backgroundColor: colors.background,
      },
      settingLabel: {
        fontSize: labelFontSize,
        color: colors.text,
      },
      selectedLabel: {
        fontWeight: '600',
      },
      languageValue: {
        fontSize: valueFontSize,
        color: colors.text,
      },
      themeContainer: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 4,
        gap: 4,
      },
      themeOption: {
        paddingHorizontal: isTablet ? 20 : 16,
        paddingVertical: isTablet ? 10 : 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
      },
      themeOptionActive: {
        backgroundColor: colors.primary,
        borderColor: colors.border,
      },
      themeOptionText: {
        fontSize: themeOptionFontSize,
        color: colors.text,
        fontWeight: '500',
      },
      themeOptionTextActive: {
        color: colors.text,
        fontWeight: '600',
      },
      linkText: {
        fontSize: labelFontSize,
        color: colors.link,
        fontWeight: '600',
      },
      languageList: {
        backgroundColor: colors.background,
      },
      languageOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: isTablet ? 16 : 12,
        paddingHorizontal: basePadding,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      selectedLanguageOption: {
        backgroundColor: isDark ? colors.surface : 'transparent',
      },
      languageOptionText: {
        fontSize: languageOptionFontSize,
        color: colors.text,
      },
      selectedLanguageText: {
        color: colors.primary,
        fontWeight: '600',
      },
      versionText: {
        fontSize: versionFontSize,
        color: colors.text,
        fontWeight: '500',
      },
      pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
      },
      settingSubLabel: {
        fontSize: subLabelFontSize,
        color: colors.text,
      },
      sunnyBannerLogoImage: {
        height: 70,
        width: sunnyBannerLogoWidth,
        marginRight: 'auto',
      },
      sunnyBanner: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: sunnyBannerPadding,
        marginTop: 20,
        height: 70,
        backgroundColor: colors.surface,
        minHeight: 70,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
      },
      sunnyBannerFooterLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: sunnyBannerGap,
        flexWrap: 'nowrap',
      },
      sunnyBannerFooterLink: {
        fontSize: sunnyBannerFontSize,
        color: colors.text,
      },
      sunnyBannerFooterDivider: {
        width: 1,
        height: 14,
        backgroundColor: colors.divider,
      },
    });
  }, [colors, isDark, isTablet, screenWidth, insets.top]);

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigateBackFromSettings(router)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Image
          source={require('../assets/icons/setting.png')}
          style={[{ height: 24, width: 24, tintColor: colors.text }, styles.headerIcon]}
          resizeMode="contain"
        />
        <Text allowFontScaling={false} style={dynamicStyles.headerTitle}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* How to Use */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => router.push('/settings/how-to-use')}
        >
          <Text style={dynamicStyles.settingLabel}>{t('settings.howToUse')}</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Calibration */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => router.push('/settings/calibration')}
        >
          <Text style={dynamicStyles.settingLabel}>{t('settings.calibration.title')}</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Language */}
        <View>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsLanguageOpen(!isLanguageOpen)}
          >
            <Text style={dynamicStyles.settingLabel}>{t('settings.language')}</Text>
            <View style={styles.languageContainer}>
              <Text style={dynamicStyles.languageValue}>{LANGUAGE_OPTIONS.find(o => o.value === language)?.label}</Text>
              <Ionicons name={isLanguageOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.arrows} />
            </View>
          </TouchableOpacity>

          {isLanguageOpen && (
            <View style={dynamicStyles.languageList}>
              {LANGUAGE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    dynamicStyles.languageOptionItem,
                    language === option.value && dynamicStyles.selectedLanguageOption,
                  ]}
                  onPress={() => {
                    setLanguage(option.value);
                    setIsLanguageOpen(false);
                  }}
                >
                  <Text
                    style={[
                      dynamicStyles.languageOptionText,
                      language === option.value && dynamicStyles.selectedLanguageText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {language === option.value && <Ionicons name="checkmark" size={20} color={colors.arrows} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Theme */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{t('settings.theme')}</Text>
          <View style={dynamicStyles.themeContainer}>
            <TouchableOpacity
              style={[dynamicStyles.themeOption, theme === 'dark' && dynamicStyles.themeOptionActive]}
              onPress={() => updateTheme('Dark')}
            >
              <Text style={[dynamicStyles.themeOptionText, theme === 'dark' && dynamicStyles.themeOptionTextActive]}>
                {t('settings.dark')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.themeOption, theme === 'light' && dynamicStyles.themeOptionActive]}
              onPress={() => updateTheme('Light')}
            >
              <Text style={[dynamicStyles.themeOptionText, theme === 'light' && dynamicStyles.themeOptionTextActive]}>
                {t('settings.light')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{t('settings.instagram')}</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://www.instagram.com/sunnyinnolab/')}
          >
            <Text style={dynamicStyles.linkText}>{t('settings.link')}</Text>
          </TouchableOpacity>
        </View>

        {/* X (Twitter) */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{t('settings.twitter')}</Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => handleLinkPress('https://x.com/Sunnyinnolab')}>
            <Text style={dynamicStyles.linkText}>{t('settings.link')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sunny's Games and Apps */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => router.push('/settings/sunny-apps')}
        >
          <Text style={dynamicStyles.settingLabel}>{t('settings.sunnyApps')}</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Credits */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => router.push('/settings/credits')}
        >
          <Text style={dynamicStyles.settingLabel}>{t('settings.credits')}</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Open Source Info */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => router.push('/settings/open-source')}
        >
          <Text style={dynamicStyles.settingLabel}>{t('settings.openSource')}</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* App Version */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{t('settings.appVersion')}</Text>
          <Text style={dynamicStyles.versionText}>v {APP_VERSION}</Text>
        </View>

        {/* Sunny banner */}
        <View style={dynamicStyles.sunnyBanner}>
          <Image
            source={require('../assets/SIL_logo_mini.png')}
            style={dynamicStyles.sunnyBannerLogoImage}
            resizeMode="contain"
          />
          <View style={dynamicStyles.sunnyBannerFooterLinks}>
            <TouchableOpacity
              onPress={() =>
                handleLinkPress(
                  'https://marmalade-neptune-dbe.notion.site/Terms-Conditions-c18656ce6c6045e590f652bf8291f28b?pvs=74'
                )
              }
            >
              <Text allowFontScaling={false} style={dynamicStyles.sunnyBannerFooterLink}>
                {t('settings.terms')}
              </Text>
            </TouchableOpacity>
            <View style={dynamicStyles.sunnyBannerFooterDivider} />
            <TouchableOpacity
              onPress={() =>
                handleLinkPress(
                  'https://marmalade-neptune-dbe.notion.site/Privacy-Policy-ced8ead72ced4d8791ca4a71a289dd6b'
                )
              }
            >
              <Text allowFontScaling={false} style={dynamicStyles.sunnyBannerFooterLink}>
                {t('settings.privacy')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: 12,
  },
  headerIcon: {
    marginRight: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
