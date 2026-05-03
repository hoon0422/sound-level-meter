import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const RANGES = [
  { min: 0, max: 20, key: 'barelyAudible', display: '<20' },
  { min: 20, max: 30, key: 'quietForest', display: '30' },
  { min: 30, max: 40, key: 'library', display: '40' },
  { min: 40, max: 50, key: 'lightRainfall', display: '50' },
  { min: 50, max: 60, key: 'casualTalk', display: '60' },
  { min: 60, max: 70, key: 'busyStreet', display: '70' },
  { min: 70, max: 80, key: 'heavyTraffic', display: '80' },
  { min: 80, max: 90, key: 'subway', display: '90' },
  { min: 90, max: 100, key: 'planeTakingOff', display: '100' },
  { min: 100, max: 150, key: 'dangerZone', display: '>110' },
];

export default function AnalysisGraph() {
  const isRunning = useAudioMeterStore(state => state.isRunning);
  const dbfs = useThrottledAudioMeterValue(state => state.dbfs);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {RANGES.map((range, index) => {
        const isActive = isRunning && dbfs >= range.min && dbfs < range.max;

        return (
          <View key={index} style={[styles.row, isActive && styles.activeRow]}>
            <View style={styles.dbColumn}>
              <Text style={[styles.text, isActive && styles.activeText]}>{range.display}dB</Text>
            </View>
            <Text style={[styles.text, isActive && styles.activeText, { flex: 1 }]} numberOfLines={1}>
              {t(`analysisGraph.${range.key}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    width: Dimensions.get('window').width - 48,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#333333',
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeRow: {
    backgroundColor: '#ffe4cad0',
  },
  iconColumn: {
    width: 28,
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
  },
  dbColumn: {
    width: 120,
    alignItems: 'flex-end',
    paddingRight: 40,
  },
  text: {
    fontSize: 13,
    color: '#8e8e93',
  },
  activeText: {
    color: '#000',
    fontWeight: '600',
  },
});
