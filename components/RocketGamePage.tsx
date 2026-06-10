import { audioVisualValues } from '@/audio/visual/audioVisualValues';
import useCalibrationStore from '@/store/calibrationStore';
import React, { memo, useCallback, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  makeMutable,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

// ─── Sizing (all images have square canvases → aspectRatio: 1) ───────────────
const ROCKET_W = 24;
const ROCKET_H = 35;
const FLAME_W = 24;
const MOON_SIZE = 24;
const LANDING_SIZE = 45;
const CONGRATS_W = 24;

// ─── Physics ─────────────────────────────────────────────────────────────────
const SPEED_DIVISOR = 3600;
const DESCENT_DB = 100;
const FRAME_MS = 16;
const MAX_FRAME_DT_SECONDS = 0.05;
const FLAME_HYSTERESIS_DB = 1.5;

// ─── Flame assets ────────────────────────────────────────────────────────────
const FLAME_SOURCES = [
  require('@/assets/rocket/flames/level1.png'), // 0–40 dB
  require('@/assets/rocket/flames/level2.png'), // 40–60 dB
  require('@/assets/rocket/flames/level3.png'), // 60–80 dB
  require('@/assets/rocket/flames/level4.png'), // 80–100 dB
  require('@/assets/rocket/flames/level5.png'), // 100+ dB
];

const PHASE_IDLE = 0;
const PHASE_ASCENDING = 1;
const PHASE_DESCENDING = 2;
const PHASE_LANDED = 3;
type PhaseValue = typeof PHASE_IDLE | typeof PHASE_ASCENDING | typeof PHASE_DESCENDING | typeof PHASE_LANDED;

const LANDING_VISUAL_NONE = 0;
const LANDING_VISUAL_CONGRATS = 1;
const LANDING_VISUAL_LANDING = 2;

const rocketValues = {
  phase: makeMutable<PhaseValue>(PHASE_IDLE),
  position: makeMutable(0),
  containerHeight: makeMutable(0),
  trackHeight: makeMutable(0),
  flameLevel: makeMutable(0),
  landingVisual: makeMutable(LANDING_VISUAL_NONE),
};

let landingTimer: ReturnType<typeof setTimeout> | null = null;

function getFrameDeltaSeconds(timeSincePreviousFrame: number | null) {
  'worklet';
  return Math.min((timeSincePreviousFrame ?? FRAME_MS) / 1000, MAX_FRAME_DT_SECONDS);
}

function getFlameLevel(db: number) {
  'worklet';
  if (db < 40) return 0;
  if (db < 60) return 1;
  if (db < 80) return 2;
  if (db < 100) return 3;
  return 4;
}

function getFlameLevelWithHysteresis(db: number, currentLevel: number) {
  'worklet';
  if (currentLevel === 0 && db < 40 + FLAME_HYSTERESIS_DB) return 0;
  if (currentLevel === 1 && db >= 40 - FLAME_HYSTERESIS_DB && db < 60 + FLAME_HYSTERESIS_DB) return 1;
  if (currentLevel === 2 && db >= 60 - FLAME_HYSTERESIS_DB && db < 80 + FLAME_HYSTERESIS_DB) return 2;
  if (currentLevel === 3 && db >= 80 - FLAME_HYSTERESIS_DB && db < 100 + FLAME_HYSTERESIS_DB) return 3;
  if (currentLevel === 4 && db >= 100 - FLAME_HYSTERESIS_DB) return 4;
  return getFlameLevel(db);
}

function clearLandingTimer() {
  if (landingTimer) {
    clearTimeout(landingTimer);
    landingTimer = null;
  }
}

function resetRocketToIdle() {
  clearLandingTimer();
  rocketValues.position.value = 0;
  rocketValues.flameLevel.value = 0;
  rocketValues.landingVisual.value = LANDING_VISUAL_NONE;
  rocketValues.phase.value = PHASE_IDLE;
}

function showLandingSequence() {
  clearLandingTimer();
  rocketValues.landingVisual.value = LANDING_VISUAL_CONGRATS;
  landingTimer = setTimeout(() => {
    landingTimer = null;
    rocketValues.landingVisual.value = LANDING_VISUAL_LANDING;
  }, 3000);
}

// ─── Component ───────────────────────────────────────────────────────────────
export function RocketGamePage() {
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const calibrationOffset = useSharedValue(offsetDb);

  const resetToIdle = useCallback(() => {
    resetRocketToIdle();
  }, []);

  useEffect(() => {
    calibrationOffset.value = offsetDb;
  }, [calibrationOffset, offsetDb]);

  useEffect(() => {
    const isRunning = audioVisualValues.isRunning.value;
    const currentPhase = rocketValues.phase.value;

    if (isRunning && (currentPhase === PHASE_IDLE || currentPhase === PHASE_DESCENDING)) {
      rocketValues.phase.value = PHASE_ASCENDING;
      return;
    }

    if (!isRunning && currentPhase === PHASE_LANDED) {
      resetToIdle();
    }
  }, [resetToIdle]);

  useAnimatedReaction(
    () => audioVisualValues.isRunning.value,
    isRunning => {
      const currentPhase = rocketValues.phase.value;

      if (isRunning && (currentPhase === PHASE_IDLE || currentPhase === PHASE_DESCENDING)) {
        rocketValues.phase.value = PHASE_ASCENDING;
        return;
      }

      if (!isRunning && currentPhase === PHASE_ASCENDING) {
        rocketValues.phase.value = PHASE_DESCENDING;
        rocketValues.flameLevel.value = 0;
        return;
      }

      if (!isRunning && currentPhase === PHASE_LANDED) {
        runOnJS(resetToIdle)();
      }
    },
    [resetToIdle]
  );

  useFrameCallback(frame => {
    const trackHeight = rocketValues.trackHeight.value;
    const phaseValue = rocketValues.phase.value;
    if (trackHeight <= 0 || phaseValue === PHASE_IDLE || phaseValue === PHASE_LANDED) {
      return;
    }

    const dt = getFrameDeltaSeconds(frame.timeSincePreviousFrame);

    if (phaseValue === PHASE_ASCENDING) {
      const db =
        audioVisualValues.hasSignal.value && audioVisualValues.isRunning.value
          ? Math.max(0, audioVisualValues.displayDb.value + calibrationOffset.value)
          : 0;
      rocketValues.flameLevel.value = getFlameLevelWithHysteresis(db, rocketValues.flameLevel.value);

      const speed = (db * trackHeight) / SPEED_DIVISOR;
      const nextPosition = Math.min(trackHeight, rocketValues.position.value + speed * dt);
      rocketValues.position.value = nextPosition;

      if (nextPosition >= trackHeight) {
        rocketValues.phase.value = PHASE_LANDED;
        rocketValues.flameLevel.value = 0;
        rocketValues.landingVisual.value = LANDING_VISUAL_CONGRATS;
        runOnJS(showLandingSequence)();
      }
      return;
    }

    if (phaseValue === PHASE_DESCENDING) {
      const descentSpeed = (DESCENT_DB * trackHeight) / SPEED_DIVISOR;
      const nextPosition = Math.max(0, rocketValues.position.value - descentSpeed * dt);
      rocketValues.position.value = nextPosition;

      if (nextPosition <= 0 && !audioVisualValues.isRunning.value) {
        rocketValues.phase.value = PHASE_IDLE;
      }
    }
  });

  const rocketStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: rocketValues.containerHeight.value - ROCKET_H - rocketValues.position.value,
      },
    ],
  }));

  const moonStyle = useAnimatedStyle(() => ({
    opacity: rocketValues.phase.value === PHASE_LANDED ? 0 : 1,
  }));

  const congratsStyle = useAnimatedStyle(() => ({
    opacity:
      rocketValues.phase.value === PHASE_LANDED && rocketValues.landingVisual.value === LANDING_VISUAL_CONGRATS ? 1 : 0,
  }));

  const landingStyle = useAnimatedStyle(() => ({
    opacity:
      rocketValues.phase.value === PHASE_LANDED && rocketValues.landingVisual.value === LANDING_VISUAL_LANDING ? 1 : 0,
  }));

  const rocketVisibilityStyle = useAnimatedStyle(() => ({
    opacity: rocketValues.phase.value === PHASE_LANDED ? 0 : 1,
  }));

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const h = e.nativeEvent.layout.height;
        const track = Math.max(0, h - MOON_SIZE - ROCKET_H);
        rocketValues.containerHeight.value = h;
        rocketValues.trackHeight.value = track;
        rocketValues.position.value = Math.min(rocketValues.position.value, track);
      }}
    >
      <Animated.Image
        source={require('@/assets/rocket/moon.png')}
        style={[styles.moon, moonStyle]}
        resizeMode="contain"
      />

      <Animated.Image
        source={require('@/assets/rocket/congrats.gif')}
        style={[styles.congrats, congratsStyle]}
        resizeMode="contain"
      />

      <Animated.Image
        source={require('@/assets/rocket/landing.gif')}
        style={[styles.landing, landingStyle]}
        resizeMode="contain"
      />

      <Animated.View style={[styles.rocketWrapper, rocketStyle, rocketVisibilityStyle]}>
        <Image source={require('@/assets/rocket/rocket.png')} style={styles.rocket} />
        <View style={styles.flameContainer}>
          {FLAME_SOURCES.map((source, index) => (
            <AnimatedFlame key={index} flameLevel={rocketValues.flameLevel} index={index} source={source} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const AnimatedFlame = memo(function AnimatedFlame({
  flameLevel,
  index,
  source,
}: {
  flameLevel: SharedValue<number>;
  index: number;
  source: (typeof FLAME_SOURCES)[number];
}) {
  const style = useAnimatedStyle(() => ({
    opacity: rocketValues.phase.value === PHASE_ASCENDING && flameLevel.value === index ? 1 : 0,
  }));

  return <Animated.Image source={source} style={[styles.flame, style]} resizeMode="contain" />;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    overflow: 'visible',
  },
  moon: {
    position: 'absolute',
    top: 0,
    width: MOON_SIZE,
    height: MOON_SIZE,
  },
  landing: {
    position: 'absolute',
    top: -10,
    width: LANDING_SIZE,
    height: LANDING_SIZE,
  },
  congrats: {
    position: 'absolute',
    top: 0,
    width: CONGRATS_W,
    height: CONGRATS_W,
  },
  rocketWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rocket: {
    width: ROCKET_W,
    height: ROCKET_H,
  },
  flameContainer: {
    width: FLAME_W,
    height: FLAME_W,
    marginTop: -8,
  },
  flame: {
    position: 'absolute',
    width: FLAME_W,
    height: FLAME_W,
  },
});
