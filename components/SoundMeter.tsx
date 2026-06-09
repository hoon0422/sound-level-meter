import { audioVisualValues } from '@/audio/visual/audioVisualValues';
import { useTheme } from '@/context/ThemeContext';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import useCalibrationStore, { applyCalibrationOffset } from '@/store/calibrationStore';
import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Surface from './Surface';

const NEEDLE_BASE_WRAPPER_SIZE = 20;
const NEEDLE_BASE_SIZE = 10;
const NEEDLE_LENGTH = 65;
const NEEDLE_WIDTH = 2.5;
const NEEDLE_COLOR = '#F2B839';
const NEEDLE_BASE_COLOR = '#E28B3E';
const MIN_DEGREE = 5;
const MAX_DEGREE = 175;
const INNER_STROKE_OFFSET = 4;
const TICK_LENGTH = 8;
const TICK_RADIUS_A = 125;
const TICK_RADIUS_B = 125;
const TICK_GAP = 13;
const TICK_WIDTH = 1.5;
const TICK_COLORS = [
  '#00ABC5',
  '#00A4BD',
  '#1EB7CF',
  '#1ECFCC',
  '#00C372',
  '#4CB522',
  '#96BE06',
  '#FBBF24',
  '#DDA618',
  '#CD970C',
  '#F8A071',
  '#F88771',
  '#F87171',
];

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const ANIMATION_DURATION = 50;

export function SoundMeter() {
  const { colors } = useTheme();
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const { isRunning, averageDbfs, maximumDbfs } = useThrottledAudioMeterValue(
    state => ({
      isRunning: state.elapsedSeconds > 0,
      averageDbfs: state.averageDbfs,
      maximumDbfs: state.maximumDbfs,
    }),
    300
  );

  return (
    <Surface style={styles.container}>
      <View style={styles.soundMeterContainer}>
        <Meter />
        <View style={styles.statsContainer}>
          <View style={styles.statContainer}>
            <Text style={[styles.avgDbText, { color: colors.info }]}>
              {isRunning ? Math.round(applyCalibrationOffset(averageDbfs, offsetDb)) : '–'}
            </Text>
            <Text style={[styles.unitText, { color: colors.text }]}>AVG</Text>
          </View>
          <AnimatedDbText color={colors.quiet} offsetDb={offsetDb} />
          <View style={styles.statContainer}>
            <Text style={[styles.maxDbText, { color: colors.loud }]}>
              {isRunning ? Math.round(applyCalibrationOffset(maximumDbfs, offsetDb)) : '–'}
            </Text>
            <Text style={[styles.unitText, { color: colors.text }]}>MAX</Text>
          </View>
        </View>
      </View>
    </Surface>
  );
}

function AnimatedDbText({ color, offsetDb }: { color: string; offsetDb: number }) {
  const calibrationOffset = useSharedValue(offsetDb);
  const animatedDb = useAnimatedCurrentDb(calibrationOffset);
  const animatedProps = useAnimatedProps<TextInputProps>(() => {
    const text = audioVisualValues.hasSignal.value ? `${Math.round(animatedDb.value)}` : '–';
    return {
      text,
      value: text,
    } as TextInputProps;
  });

  useEffect(() => {
    calibrationOffset.value = offsetDb;
  }, [calibrationOffset, offsetDb]);

  return (
    <AnimatedTextInput
      animatedProps={animatedProps}
      caretHidden
      contextMenuHidden
      defaultValue="–"
      editable={false}
      pointerEvents="none"
      style={[styles.dbfsText, { color }]}
      underlineColorAndroid="transparent"
    />
  );
}

function useAnimatedDisplayDb(calibrationOffset: SharedValue<number>) {
  const targetDb = useDerivedValue(() => {
    if (!audioVisualValues.hasSignal.value) {
      return 0;
    }
    return Math.min(120, Math.max(0, audioVisualValues.displayDb.value + calibrationOffset.value));
  });

  return useDerivedValue(() => withTiming(targetDb.value, { duration: ANIMATION_DURATION }));
}

function useAnimatedCurrentDb(calibrationOffset: SharedValue<number>) {
  const targetDb = useDerivedValue(() => {
    if (!audioVisualValues.hasSignal.value) {
      return 0;
    }
    return audioVisualValues.displayDb.value + calibrationOffset.value;
  });

  return useDerivedValue(() => withTiming(targetDb.value, { duration: ANIMATION_DURATION }));
}

function Meter() {
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const calibrationOffset = useSharedValue(offsetDb);
  const animatedProgress = useAnimatedDisplayDb(calibrationOffset);

  useEffect(() => {
    calibrationOffset.value = offsetDb;
  }, [calibrationOffset, offsetDb]);

  const needleStyle = useAnimatedStyle(() => {
    const degrees = interpolate(
      animatedProgress.value,
      [0, 120],
      [MIN_DEGREE - 90, MAX_DEGREE - 90],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: -NEEDLE_WIDTH / 2 },
        { translateY: -(NEEDLE_LENGTH + NEEDLE_BASE_WRAPPER_SIZE / 2) },
        { rotate: `${degrees}deg` },
      ],
    };
  });

  const pathLength = Math.PI * 120;
  const animatedPathProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(animatedProgress.value, [0, 120], [pathLength, 0], Extrapolation.CLAMP);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.meter}>
      <Svg width="260" height="140" viewBox="0 0 260 140" fill="none">
        <Defs>
          {/* Simplified the coordinates to percentages so it scales cleanly */}
          <LinearGradient id="paint0" x1="100%" y1="0%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#F87171" />
            <Stop offset="36.5%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#22D3EE" />
          </LinearGradient>
        </Defs>
        <Path
          d="M 10 130 A 120 120 0 0 1 250 130"
          stroke="url(#paint0)"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.35"
          fill="none"
        />
        <AnimatedPath
          d="M 10 130 A 120 120 0 0 1 250 130"
          stroke="url(#paint0)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          animatedProps={animatedPathProps}
          fill="none"
        />
      </Svg>
      <View style={[styles.needleBaseWrapper, { borderColor: NEEDLE_COLOR }]}>
        <View style={[styles.needleBase, { backgroundColor: NEEDLE_BASE_COLOR }]} />
      </View>
      <GaugeTicks />
      <Animated.View style={[styles.needle, { borderColor: NEEDLE_COLOR }, needleStyle]} />
    </View>
  );
}

function GaugeTicks() {
  const { colors } = useTheme();
  return (
    <>
      {Array.from({ length: TICK_COLORS.length }).map((_, index) => {
        const angle = index * (180 / (TICK_COLORS.length - 1));
        const isMajor = index % 2 === 0;
        const numberValue = index * 10;

        const theta = angle * (Math.PI / 180);

        // r(θ) = (a * b) / sqrt((b * cos(θ))^2 + (a * sin(θ))^2)
        const dynamicRadius =
          (TICK_RADIUS_A * TICK_RADIUS_B) /
          Math.sqrt(Math.pow(TICK_RADIUS_B * Math.cos(theta), 2) + Math.pow(TICK_RADIUS_A * Math.sin(theta), 2));

        const tickOffset = -dynamicRadius + TICK_GAP - INNER_STROKE_OFFSET;
        const numberOffset = -dynamicRadius + 30 - INNER_STROKE_OFFSET;

        return (
          <View key={index} style={[styles.centerPivot, { transform: [{ rotate: `${angle - 90}deg` }] }]}>
            <View
              style={[styles.tick, { borderColor: TICK_COLORS[index] }, { transform: [{ translateY: tickOffset }] }]}
            />
            {isMajor && (
              <View style={[styles.numberContainer, { transform: [{ translateY: numberOffset }] }]}>
                <Text
                  style={[styles.numberText, { color: colors.mutedText, transform: [{ rotate: `${90 - angle}deg` }] }]}
                >
                  {numberValue}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingVertical: 22,
    width: 320,
    height: 248,
  },
  soundMeterContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 30,
    width: '100%',
  },
  statContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dbfsText: {
    backgroundColor: 'transparent',
    fontFamily: 'DM Sans',
    fontWeight: 600,
    fontSize: 48,
    height: 58,
    letterSpacing: 0,
    minWidth: 86,
    padding: 0,
    textAlign: 'center',
  },
  avgDbText: {
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: 30,
    letterSpacing: 0,
    textAlign: 'center',
  },
  maxDbText: {
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: 30,
    letterSpacing: 0,
    textAlign: 'center',
  },
  unitText: {
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: 14,
    letterSpacing: 0,
    textAlign: 'center',
  },
  meter: {
    position: 'relative',
  },
  needleBase: {
    ...StyleSheet.absoluteFillObject,
    width: NEEDLE_BASE_SIZE,
    height: NEEDLE_BASE_SIZE,
    borderRadius: NEEDLE_BASE_SIZE / 2,
    left: '50%',
    top: '50%',
    transform: [{ translateX: -NEEDLE_BASE_SIZE / 2 }, { translateY: -NEEDLE_BASE_SIZE / 2 }],
  },
  needleBaseWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    width: NEEDLE_BASE_WRAPPER_SIZE,
    height: NEEDLE_BASE_WRAPPER_SIZE,
    borderRadius: NEEDLE_BASE_WRAPPER_SIZE / 2,
    borderWidth: NEEDLE_WIDTH,
    left: '50%',
    top: '100%',
    transform: [{ translateX: -NEEDLE_BASE_WRAPPER_SIZE / 2 }, { translateY: -NEEDLE_BASE_WRAPPER_SIZE / 2 }],
  },
  needle: {
    ...StyleSheet.absoluteFillObject,
    width: NEEDLE_WIDTH,
    height: NEEDLE_LENGTH,
    borderLeftWidth: NEEDLE_WIDTH / 2,
    borderRightWidth: NEEDLE_WIDTH / 2,
    left: '50%',
    top: '100%',
    transformOrigin: `center -${NEEDLE_LENGTH + NEEDLE_BASE_WRAPPER_SIZE / 2}px`,
  },
  centerPivot: {
    position: 'absolute',
    bottom: 10,
    left: 130,
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    borderRadius: 2,
    height: TICK_LENGTH,
    width: TICK_WIDTH,
    borderLeftWidth: TICK_WIDTH / 2,
    borderRightWidth: TICK_WIDTH / 2,
  },
  numberContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    lineHeight: 18,
    letterSpacing: -0.5,
  },
});
