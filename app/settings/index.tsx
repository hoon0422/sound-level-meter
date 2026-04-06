import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

type RootStackParamList = {
  HowToUse: undefined;
  Calibration: undefined;
  SunnyGamesApps: undefined;
  Credits: undefined;
  OpenSourceLicenses: undefined;
};

type SettingsItem = {
  label: string;
  chevron?: boolean;
  route?: keyof RootStackParamList | null;
  value?: string;
  url?: string;
};

const SETTINGS_SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: 'General',
    items: [
      { label: 'How to Use', chevron: true, route: 'HowToUse' },
      { label: 'Language', value: 'English', route: null },
      { label: 'Notifications', value: 'Enabled', route: null },
      { label: 'Theme', value: 'Light', route: null },
    ],
  },
  {
    title: 'Calibration',
    items: [
      { label: 'Calibration', chevron: true, route: 'Calibration' },
    ],
  },
  {
    title: 'About',
    items: [
      { label: 'Instagram', value: 'Link', route: null, url: 'https://www.instagram.com/' },
      { label: 'X (Twitter)', value: 'Link', route: null, url: 'https://x.com/' },
      { label: "Sunny's Games and Apps", chevron: true, route: 'SunnyGamesApps' },
      { label: 'Credits', chevron: true, route: 'Credits' },
      { label: 'Open Source Licenses', chevron: true, route: 'OpenSourceLicenses' },
      { label: 'Version', value: 'v1.0', route: null },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();

  const handlePress = (item: SettingsItem) => {
    if (item.route) router.push(`/settings/${item.route}` as any);
    else if (item.url) Linking.openURL(item.url);
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => {
                const isTappable = !!(item.route || item.url);
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.row,
                      index < section.items.length - 1 && styles.rowBorder,
                    ]}
                    activeOpacity={isTappable ? 0.6 : 1}
                    onPress={() => handlePress(item)}
                  >
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={[styles.rowValue, item.url && styles.rowLink]}>
                      {item.chevron ? '›' : item.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f7',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b6b6b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  rowLabel: {
    fontSize: 16,
    color: '#000',
  },
  rowValue: {
    fontSize: 16,
    color: '#8e8e93',
  },
  rowLink: {
    color: '#007aff',
    fontWeight: '500',
  },
});