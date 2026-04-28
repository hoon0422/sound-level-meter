import React, { useState, useMemo } from 'react';
import {
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

const APP_VERSION = '1.0';

const LANGUAGE_OPTIONS = [{ label: 'English', value: 1 }];

export default function SettingsPage() {
  const { colors: themeColors, themeName, setTheme } = useTheme();
  const isDark = themeName === 'dark';
  const theme = themeName;

  const colors = {
    background: themeColors.background,
    text: themeColors.text,
    primary: themeColors.primary,
    border: themeColors.border,

    link: themeColors.text,
    arrows: themeColors.primary,
  };

  const updateTheme = (val: 'Dark' | 'Light') => setTheme(val === 'Dark' ? 'dark' : 'light');

  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const userLanguage = 1;
  const language = 1;

  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const insets = useSafeAreaInsets();

  const handleLinkPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert('Could not open link', error.message);
    }
  };

  const comingSoon = () => Alert.alert('Coming Soon', 'This feature will be available in a future update.');

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
        borderBottomColor: '#000000',
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
        borderBottomColor: '#000000',
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
        color: isDark ? '#fff"' : '#000',
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
        borderBottomColor: '#000000',
      },
      selectedLanguageOption: {
        backgroundColor: isDark ? '#1e293b' : 'transparent',
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
      sunnyBanner: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: sunnyBannerPadding,
        marginTop: 20,
        height: 70,
        backgroundColor: '#2d2d2d',
        minHeight: 70,
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
        color: '#ffffff',
      },
      sunnyBannerFooterDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#ffffff',
      },
    });
  }, [colors, isDark, isTablet, screenWidth, theme, insets.top]);

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Ionicons name="settings-outline" size={24} color={colors.text} style={styles.headerIcon} />
        <Text allowFontScaling={false} style={dynamicStyles.headerTitle}>
          Settings
        </Text>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* How to Use */}
        <TouchableOpacity style={dynamicStyles.settingItem} activeOpacity={0.7} onPress={comingSoon}>
          <Text style={dynamicStyles.settingLabel}>How To Use</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Language */}
        <View>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsLanguageOpen(!isLanguageOpen)}
          >
            <Text style={dynamicStyles.settingLabel}>Language</Text>
            <View style={styles.languageContainer}>
              <Text style={dynamicStyles.languageValue}>English</Text>
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
                  onPress={() => setIsLanguageOpen(false)}
                >
                  <Text
                    style={[
                      dynamicStyles.languageOptionText,
                      userLanguage === option.value && dynamicStyles.selectedLanguageText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {userLanguage === option.value && <Ionicons name="checkmark" size={20} color={colors.arrows} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Theme */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>Theme</Text>
          <View style={dynamicStyles.themeContainer}>
            <TouchableOpacity
              style={[dynamicStyles.themeOption, theme === 'dark' && dynamicStyles.themeOptionActive]}
              onPress={() => updateTheme('Dark')}
            >
              <Text style={[dynamicStyles.themeOptionText, theme === 'dark' && dynamicStyles.themeOptionTextActive]}>
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.themeOption, theme === 'light' && dynamicStyles.themeOptionActive]}
              onPress={() => updateTheme('Light')}
            >
              <Text style={[dynamicStyles.themeOptionText, theme === 'light' && dynamicStyles.themeOptionTextActive]}>
                Light
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>Instagram</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://www.instagram.com/sunnyinnolab/')}
          >
            <Text style={dynamicStyles.linkText}>Link</Text>
          </TouchableOpacity>
        </View>

        {/* X (Twitter) */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>X (Twitter)</Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => handleLinkPress('https://x.com/Sunnyinnolab')}>
            <Text style={dynamicStyles.linkText}>Link</Text>
          </TouchableOpacity>
        </View>

        {/* Sunny's Games and Apps */}
        <TouchableOpacity style={dynamicStyles.settingItem} activeOpacity={0.7} onPress={comingSoon}>
          <Text style={dynamicStyles.settingLabel}>Sunny Games Apps</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Credits */}
        <TouchableOpacity style={dynamicStyles.settingItem} activeOpacity={0.7} onPress={comingSoon}>
          <Text style={dynamicStyles.settingLabel}>Credits</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* Open Source Info */}
        <TouchableOpacity style={dynamicStyles.settingItem} activeOpacity={0.7} onPress={comingSoon}>
          <Text style={dynamicStyles.settingLabel}>Open Source Info</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.arrows} />
        </TouchableOpacity>

        {/* App Version */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>App Version</Text>
          <Text style={dynamicStyles.versionText}>v {APP_VERSION}</Text>
        </View>

        {/* Sunny banner */}
        <View style={dynamicStyles.sunnyBanner}>
          <View style={dynamicStyles.sunnyBannerFooterLinks}>
            <TouchableOpacity
              onPress={() =>
                handleLinkPress(
                  'https://marmalade-neptune-dbe.notion.site/Terms-Conditions-c18656ce6c6045e590f652bf8291f28b?pvs=74'
                )
              }
            >
              <Text allowFontScaling={false} style={dynamicStyles.sunnyBannerFooterLink}>
                Terms
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
                Privacy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
