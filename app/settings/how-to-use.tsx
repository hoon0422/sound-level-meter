import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { navigateBackFromSettings } from '@/navigation/settings';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

export default function HowToUsePage() {
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
  };

  const basePadding = isTablet ? 40 : 20;
  const headerFontSize = isTablet ? 32 : 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, paddingHorizontal: basePadding, borderBottomColor: '#000000' },
        ]}
      >
        <TouchableOpacity onPress={() => navigateBackFromSettings(router)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text, fontSize: headerFontSize }]}>
          {t('settings.howToUse')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}></ScrollView>
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
});
