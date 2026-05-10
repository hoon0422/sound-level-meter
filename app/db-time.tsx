import { RecordButton } from '@/components/RecordButton';
import SoundGraph from '@/components/SoundGraph';
import { SoundMeter } from '@/components/SoundMeter';
import { StyleSheet, View } from 'react-native';

export default function DbTimeScreen() {
  return (
    <View style={styles.page}>
      <SoundMeter />
      <SoundGraph />
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
});
