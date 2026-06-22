import { useTheme } from '@/context/ThemeContext';
import { navigateBackFromSettings } from '@/navigation/settings';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREDITS: { role: string; names: string[] }[] = [
  { role: 'Producer', names: ['R.S.'] },
  { role: 'Programmers', names: ['Younghoon', 'Damin'] },
  { role: 'UI/UX Designer', names: ['Emily'] },
  { role: 'Rocket Artist', names: ['Chloe'] },
  { role: 'QA Testers', names: ['SJ', 'JA'] },
  { role: 'Special Thanks', names: ['Thomas', 'Eunsun', 'Jun', 'Donna', 'Daniel'] },
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
    divider: themeColors.divider,
    surface: themeColors.surface,
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
        <Ionicons name="people" size={28} color={colors.text} style={styles.headerIcon} />
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text, fontSize: headerFontSize }]}>
          {t('settings.credits')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {CREDITS.map(credit => {
          const names = credit.names.join(', ');
          const isLongCredit = credit.role === 'Special Thanks';

          return (
            <View
              key={credit.role}
              style={[
                styles.creditItem,
                isLongCredit && styles.longCreditItem,
                { paddingHorizontal: basePadding, borderBottomColor: colors.divider },
              ]}
            >
              <Text style={[styles.roleText, { color: colors.text, fontSize: itemFontSize }]}>{credit.role}</Text>
              <Text
                style={[
                  styles.nameText,
                  isLongCredit && styles.longNameText,
                  { color: colors.text, fontSize: itemFontSize },
                ]}
              >
                {names}
              </Text>
            </View>
          );
        })}
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
  headerIcon: { marginRight: 12 },
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
  longCreditItem: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  roleText: { fontWeight: '500', flex: 1 },
  nameText: {
    flex: 1.4,
    fontWeight: '400',
    textAlign: 'right',
  },
  longNameText: {
    flex: 0,
    width: '100%',
    textAlign: 'left',
  },
});
