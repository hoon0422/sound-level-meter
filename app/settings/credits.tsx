import { useTheme } from '@/context/ThemeContext';
import { navigateBackFromSettings } from '@/navigation/settings';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREDITS: { role: string; names: string[] }[] = [
  { role: 'Programmers', names: ['Younghoon', 'Damin'] },
  { role: 'UI/UX Designer', names: ['Emily'] },
  { role: 'Rocket Artist', names: ['Chloe'] },
  { role: 'QA Testers', names: ['SJ', 'JA'] },
  { role: 'Special Thanks', names: ['Thomas', 'Eunsun', 'Jun'] },
];

export default function CreditsPage() {
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
  const itemFontSize = isTablet ? 18 : 16;

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
          {t('settings.credits')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {CREDITS.map(credit => (
          <View
            key={credit.role}
            style={[styles.creditItem, { paddingHorizontal: basePadding, borderBottomColor: colors.border }]}
          >
            <Text style={[styles.roleText, { color: colors.text, fontSize: itemFontSize }]}>{credit.role}</Text>
            <View style={styles.namesContainer}>
              {credit.names.map(name => (
                <Text key={name} style={[styles.nameText, { color: colors.text, fontSize: itemFontSize }]}>
                  {name}
                </Text>
              ))}
            </View>
          </View>
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
  creditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 20,
    borderBottomWidth: 1,
    gap: 16,
  },
  roleText: { fontWeight: '500', flex: 1 },
  namesContainer: { alignItems: 'flex-end', gap: 2 },
  nameText: { fontWeight: '400', textAlign: 'right' },
});
