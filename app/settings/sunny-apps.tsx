import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

const APPS: { name: string; icon?: ReturnType<typeof require>; url: string }[] = [
  { name: 'Sky Peacemaker - Finger Force', icon: require('../assets/app_icons/skyPeacemaker.png'), url: 'https://skypeacemaker.onelink.me/YQxG/8s9sx66i' },
  { name: 'World Movie Trailer', icon: require('../assets/app_icons/worldMovieTrailer.png'), url: 'https://wmt.onelink.me/YPN9/m428wgpq' },
  { name: 'World Book Ranking', icon: require('../assets/app_icons/worldBookRanking.png'), url: 'https://worldbookranking.onelink.me/so3H/gftf32rq' },
  { name: 'Simply Multi Timer', icon: require('../assets/app_icons/simplyMultiTimer.png'), url: 'https://simplymultitimer.onelink.me/6kU2/v7i9ke1m' },
  { name: 'Wisdom Qclock', icon: require('../assets/app_icons/wisdomQclock.png'), url: 'https://wisdomqclock.onelink.me/SVr2/b7gs4og1' },
  { name: 'Play Memo', icon: require('../assets/app_icons/playMemo.png'), url: 'https://playmemo.onelink.me/LdOZ/6bbfoohf' },
  { name: 'Find Four', icon: require('../assets/app_icons/findFour.png'), url: 'https://findfour.onelink.me/vurA/0tfteiuf' },
  { name: 'Dual Flashlight', icon: require('../assets/app_icons/dualFlashlight.png'), url: 'https://dualflashlight.onelink.me/7gkq/qpbc8y65' },
  { name: 'Histree', icon: require('../assets/app_icons/histree.png'), url: 'https://histree.onelink.me/xyz7/abc123' },
  { name: 'Scanatory', icon: require('../assets/app_icons/scanatory.png'), url: 'https://scanatory.onelink.me/zzpK/2tr21jtp' },
  { name: 'Decibella', icon: require('../assets/app_icons/decibella.png'), url: 'https://decibella.onelink.me/Ve6i/vydwhkh4' },
];

export default function SunnyAppsPage() {
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
  const appNameFontSize = isTablet ? 18 : 16;
  const iconSize = isTablet ? 60 : 52;

  const handleAppPress = async (url: string) => {
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
          { paddingTop: insets.top + 8, paddingHorizontal: basePadding, borderBottomColor: '#000000' },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text
          allowFontScaling={false}
          style={[styles.headerTitle, { color: colors.text, fontSize: headerFontSize }]}
        >
          {t('settings.sunnyApps')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {APPS.map((app) => (
          <TouchableOpacity
            key={app.name}
            style={[styles.appItem, { paddingHorizontal: basePadding, borderBottomColor: '#000000' }]}
            activeOpacity={0.7}
            onPress={() => handleAppPress(app.url)}
          >
            {app.icon ? (
              <Image
                source={app.icon}
                style={[styles.appIcon, { width: iconSize, height: iconSize }]}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.appIcon, styles.appIconPlaceholder, { width: iconSize, height: iconSize }]} />
            )}
            <Text style={[styles.appName, { color: colors.text, fontSize: appNameFontSize }]}>{app.name}</Text>
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
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 16,
  },
  appIcon: { borderRadius: 12 },
  appIconPlaceholder: { backgroundColor: '#e0e0e0' },
  appName: { flex: 1, fontWeight: '500' },
});
