import GraphsLayout from '@/components/GraphTabLayout';
import SoundGraph from '@/components/SoundGraph';

export default function DbTimeScreen() {
  const { colors } = useTheme();
  const dbfs = useThrottledAudioMeterValue(state =>  state.dbfs);
  const isRunning = useAudioMeterStore(state => state.isRunning);
  const dbDisplay = isRunning ? `${dbfs.toFixed(1)} dB` : '— dB';

  return (
    <GraphsLayout>
      <SoundGraph />
    </GraphsLayout>
  );
}
