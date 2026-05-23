import React from 'react';
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
import { navigateBackFromSettings } from '@/navigation/settings';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

const PACKAGES = [
  { name: 'React Native', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', url: 'https://github.com/expo/expo' },
  { name: 'expo-router', url: 'https://github.com/expo/expo' },
  {
    name: 'react-native-audio-api',
    url: 'https://github.com/software-mansion/react-native-audio-api',
  },
  {
    name: 'react-native-reanimated',
    url: 'https://github.com/software-mansion/react-native-reanimated',
  },
  {
    name: 'react-native-safe-area-context',
    url: 'https://github.com/th3rdwave/react-native-safe-area-context',
  },
  {
    name: 'react-native-screens',
    url: 'https://github.com/software-mansion/react-native-screens',
  },
  {
    name: 'react-native-gesture-handler',
    url: 'https://github.com/software-mansion/react-native-gesture-handler',
  },
  { name: 'i18next', url: 'https://github.com/i18next/i18next' },
  { name: 'react-i18next', url: 'https://github.com/i18next/react-i18next' },
  { name: 'zustand', url: 'https://github.com/pmndrs/zustand' },
  { name: '@expo/vector-icons', url: 'https://github.com/expo/vector-icons' },
  {
    name: '@react-native-async-storage/async-storage',
    url: 'https://github.com/react-native-async-storage/async-storage',
  },
  { name: 'expo-localization', url: 'https://github.com/expo/expo' },
];

export default function OpenSourcePage() {
  const { colors: themeColors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const colors = {
    background: themeColors.background,
    text: themeColors.text,
    primary: themeColors.primary,
    border: themeColors.border,
  };

  const basePadding = isTablet ? 40 : 20;
  const headerFontSize = isTablet ? 32 : 24;
  const nameFontSize = isTablet ? 17 : 15;

  const handleLinkPress = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert(t('settings.linkErrorTitle'), error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, paddingHorizontal: basePadding, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigateBackFromSettings(router)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text, fontSize: headerFontSize }]}>
          {t('settings.openSource')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {PACKAGES.map(pkg => (
          <TouchableOpacity
            key={pkg.name}
            style={[styles.packageItem, { paddingHorizontal: basePadding, borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => handleLinkPress(pkg.url)}
          >
            <View style={styles.packageInfo}>
              <Text style={[styles.packageName, { color: colors.text, fontSize: nameFontSize }]}>{pkg.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontWeight: 'bold', flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  packageInfo: { flex: 1, gap: 2 },
  packageName: { fontWeight: '500' },
});
