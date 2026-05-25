import { RecordingLogCard } from '@/components/RecordingLogCard';
import { useTheme } from '@/context/ThemeContext';
import useLogsStore, { RecordingLog } from '@/store/logsStore';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function LogScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { logs, deleteLog } = useLogsStore();
  const [resetSignal, setResetSignal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      return () => setResetSignal(signal => signal + 1);
    }, [])
  );

  const renderItem = ({ item, index }: { item: RecordingLog; index: number }) => (
    <RecordingLogCard item={item} index={index} logCount={logs.length} onDelete={deleteLog} resetSignal={resetSignal} />
  );

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('log.noRecordings')}</Text>
          <Text style={[styles.emptySubText, { color: colors.mutedText }]}>{t('log.noRecordingsSubText')}</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior="automatic"
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
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
  },
  emptySubText: {
    fontSize: 14,
  },
});
