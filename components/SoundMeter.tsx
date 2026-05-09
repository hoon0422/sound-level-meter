import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import WhiteContainer from './WhiteContainer';

const NEEDLE_BASE_WRAPPER_SIZE = 18;
const NEEDLE_LENGTH = 65;
const NEEDLE_WIDTH = 1.5;
const MIN_DEGREE = 5;
const MAX_DEGREE = 175;
const INNER_STROKE_OFFSET = 4;
const TICK_LENGTH = 10;
const TICK_RADIUS_A = 120;
const TICK_RADIUS_B = 120;
const TICK_GAP = 12;
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
const ANIMATION_DURATION = 50;

export function SoundMeter() {
  const { isRunning, dbfs, averageDbfs, maximumDbfs } = useThrottledAudioMeterValue(
    state => ({
      isRunning: state.isRunning && state.elapsedSeconds > 0,
      dbfs: state.dbfs,
      averageDbfs: state.averageDbfs,
      maximumDbfs: state.maximumDbfs,
    }),
    300
  );

  return (
    <WhiteContainer style={styles.container}>
      <View style={styles.soundMeterContainer}>
        <Meter />
        <View style={styles.statsContainer}>
          <View style={styles.statContainer}>
            <Text style={styles.avgDbText}>{isRunning ? Math.round(averageDbfs) : '–'}</Text>
            <Text style={styles.unitText}>AVG</Text>
          </View>
          <Text style={styles.dbfsText}>{isRunning ? Math.round(dbfs) : '–'}</Text>
          <View style={styles.statContainer}>
            <Text style={styles.maxDbText}>{isRunning ? Math.round(maximumDbfs) : '–'}</Text>
            <Text style={styles.unitText}>MAX</Text>
          </View>
        </View>
      </View>
    </WhiteContainer>
  );
}

function Meter() {
  const dbfs = useThrottledAudioMeterValue(state => (state.isRunning ? state.dbfs : 0), ANIMATION_DURATION);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: dbfs,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [animatedProgress, dbfs]);

  const spinString = animatedProgress.interpolate({
    inputRange: [0, 120],
    outputRange: [`${MIN_DEGREE - 90}deg`, `${MAX_DEGREE - 90}deg`],
    extrapolate: 'clamp',
  });
  const pathLength = Math.PI * 120;
  const animatedStrokeOffset = animatedProgress.interpolate({
    inputRange: [0, 120],
    outputRange: [pathLength, 0],
    extrapolate: 'clamp',
  });

  return (
    <View className="sound-meter" style={styles.meter}>
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
          strokeDashoffset={animatedStrokeOffset}
          fill="none"
        />
      </Svg>
      <View style={styles.needleBaseWrapper}>
        <View style={styles.needleBase} />
      </View>
      <GaugeTicks />
      <Animated.View
        style={[
          styles.needle,
          {
            transform: [
              { translateX: '-50%' },
              { translateY: -(NEEDLE_LENGTH + NEEDLE_BASE_WRAPPER_SIZE / 2) },
              { rotate: spinString },
            ],
          },
        ]}
      />
    </View>
  );
}

function GaugeTicks() {
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
                <Text style={[styles.numberText, { transform: [{ rotate: `${90 - angle}deg` }] }]}>{numberValue}</Text>
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
    gap: 30,
  },
  statContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dbfsText: {
    fontFamily: 'DM Sans',
    fontWeight: 600,
    fontSize: 48,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#4CB522',
  },
  avgDbText: {
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: 30,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#20B9D0',
  },
  maxDbText: {
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: 30,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#E23F3F',
  },
  unitText: {
    fontFamily: 'DM Sans',
    fontWeight: 300,
    fontSize: 14,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#333333',
  },
  meter: {
    position: 'relative',
  },
  needleBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0923A',
    width: 10,
    height: 10,
    borderRadius: 5,
    left: '50%',
    top: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
  needleBaseWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderColor: '#D6C7B5',
    backgroundColor: 'transparent',
    width: NEEDLE_BASE_WRAPPER_SIZE,
    height: NEEDLE_BASE_WRAPPER_SIZE,
    borderRadius: NEEDLE_BASE_WRAPPER_SIZE / 2,
    borderWidth: 1.5,
    left: '50%',
    top: '100%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
  needle: {
    ...StyleSheet.absoluteFillObject,
    borderColor: '#D6C7B5',
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
    width: NEEDLE_WIDTH,
    borderLeftWidth: NEEDLE_WIDTH / 2,
    borderRightWidth: NEEDLE_WIDTH / 2,
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
    color: '#6B6459',
  },
});
