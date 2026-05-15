import useLogsStore, { RecordingLog } from '@/store/logsStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function LogScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { logs } = useLogsStore();

  const renderItem = ({ item, index }: { item: RecordingLog; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIndex}>#{logs.length - index}</Text>
        <Text style={styles.cardDate}>
          {item.date} · {item.time}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('log.duration')}</Text>
          <Text style={styles.statValue}>{item.duration}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('stats.max')}</Text>
          <Text style={[styles.statValue, styles.maxColor]}>{item.maxDb} dB</Text>
        </View>
        {/* <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('stats.min')}</Text>
          <Text style={[styles.statValue, styles.minColor]}>{item.minDb} dB</Text>
        </View> */}
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('stats.average')}</Text>
          <Text style={[styles.statValue, styles.avgColor]}>{item.avgDb} dB</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('log.noRecordings')}</Text>
          <Text style={styles.emptySubText}>{t('log.noRecordingsSubText')}</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#333333',
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIndex: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  cardDate: {
    fontSize: 13,
    color: '#8e8e93',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  maxColor: {
    color: '#ef4444',
  },
  minColor: {
    color: '#3b82f6',
  },
  avgColor: {
    color: '#22c55e',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  emptySubText: {
    fontSize: 14,
    color: '#8e8e93',
  },
});
