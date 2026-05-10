import FrequencyBarGraph from '@/components/FrequencyBarGraph';
import { RecordButton } from '@/components/RecordButton';
import { SoundMeter } from '@/components/SoundMeter';
import { StyleSheet, View } from 'react-native';

export default function DbFreqScreen() {
  return (
    <View style={styles.page}>
      <SoundMeter />
      <FrequencyBarGraph />
      <RecordButton />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
    backgroundColor: '#FEFAEE',
  },
  dbText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
  },
});
