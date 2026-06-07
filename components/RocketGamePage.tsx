import useCalibrationStore, { applyCalibrationOffset } from '@/store/calibrationStore';
import { audioMeterStore } from '@/store/audioMeterStore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

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

// ─── Flame assets ────────────────────────────────────────────────────────────
const FLAME_SOURCES = [
  require('@/assets/rocket/flames/level1.png'), // 0–40 dB
  require('@/assets/rocket/flames/level2.png'), // 40–60 dB
  require('@/assets/rocket/flames/level3.png'), // 60–80 dB
  require('@/assets/rocket/flames/level4.png'), // 80–100 dB
  require('@/assets/rocket/flames/level5.png'), // 100+ dB
];

function getFlameIdx(db: number): number {
  if (db < 40) return 0;
  if (db < 60) return 1;
  if (db < 80) return 2;
  if (db < 100) return 3;
  return 4;
}

// ─── Types ───────────────────────────────────────────────────────────────────
type GamePhase = 'idle' | 'ascending' | 'descending' | 'landed';

// Module-level state — survives tab switches (remounts)
let _phase: GamePhase = 'idle';
let _position = 0; // 0 = ground, trackHeight = moon

// ─── Component ───────────────────────────────────────────────────────────────
export function RocketGamePage() {
  const [phase, setPhase] = useState<GamePhase>(_phase);
  const [flameIdx, setFlameIdx] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  // Refs used inside setInterval (avoid stale closures)
  const phaseRef = useRef<GamePhase>(_phase);
  const posRef = useRef(_position);
  const trackRef = useRef(0);
  const containerHRef = useRef(0);
  // top = containerH - ROCKET_H - position
  //   pos=0 → rocket at bottom (ground)
  //   pos=trackH → rocket just below moon
  const topAnim = useRef(new Animated.Value(0)).current;
  const congratsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Store subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    return audioMeterStore.subscribe(state => {
      const running = state.isRunning;
      const cur = phaseRef.current;

      if (running && (cur === 'idle' || cur === 'descending')) {
        phaseRef.current = _phase = 'ascending';
        setPhase('ascending');
      } else if (!running && cur === 'ascending') {
        phaseRef.current = _phase = 'descending';
        setPhase('descending');
      } else if (!running && cur === 'landed') {
        if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
        posRef.current = _position = 0;
        topAnim.setValue(containerHRef.current - ROCKET_H);
        phaseRef.current = _phase = 'idle';
        setShowCongrats(false);
        setPhase('idle');
      }
    });
  }, [topAnim]);

  // ── Physics loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const ph = phaseRef.current;
      const h = trackRef.current;
      if (ph === 'idle' || ph === 'landed' || h === 0) return;

      const dt = FRAME_MS / 1000;

      if (ph === 'ascending') {
        const rawDb = audioMeterStore.getState().dbfs ?? 0;
        const offsetDb = useCalibrationStore.getState().offsetDb;
        const db = rawDb > 0 ? applyCalibrationOffset(rawDb, offsetDb) : 0;

        setFlameIdx(getFlameIdx(db));

        const speed = (db * h) / SPEED_DIVISOR;
        const newPos = Math.min(h, posRef.current + speed * dt);
        posRef.current = _position = newPos;
        topAnim.setValue(containerHRef.current - ROCKET_H - newPos);

        if (newPos >= h) {
          phaseRef.current = _phase = 'landed';
          setPhase('landed');
          setShowCongrats(true);
          congratsTimerRef.current = setTimeout(() => setShowCongrats(false), 3000);
        }
      } else if (ph === 'descending') {
        const descentSpeed = (DESCENT_DB * h) / SPEED_DIVISOR;
        const newPos = Math.max(0, posRef.current - descentSpeed * dt);
        posRef.current = _position = newPos;
        topAnim.setValue(containerHRef.current - ROCKET_H - newPos);

        if (newPos <= 0 && !audioMeterStore.getState().isRunning) {
          phaseRef.current = _phase = 'idle';
          setPhase('idle');
        }
      }
    }, FRAME_MS);

    return () => clearInterval(interval);
  }, [topAnim]);

  const isLanded = phase === 'landed';
  const isAscending = phase === 'ascending';

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const h = e.nativeEvent.layout.height;
        containerHRef.current = h;
        const track = h - MOON_SIZE - ROCKET_H;
        if (track > 0) trackRef.current = track;
        topAnim.setValue(h - ROCKET_H - posRef.current);
      }}
    >
      {/* Moon at top (hidden only during landing) */}
      {!isLanded && (
        <Image
          source={require('@/assets/rocket/moon.png')}
          style={styles.moon}
          resizeMode="contain"
        />
      )}

      {/* Congrats: shown first for 3s when rocket reaches moon */}
      {isLanded && showCongrats && (
        <Image
          source={require('@/assets/rocket/congrats.gif')}
          style={styles.congrats}
          resizeMode="contain"
        />
      )}

      {/* Landing: shown after congrats finishes */}
      {isLanded && !showCongrats && (
        <Image
          source={require('@/assets/rocket/landing.gif')}
          style={styles.landing}
          resizeMode="contain"
        />
      )}

      {/* Rocket + flame */}
      {!isLanded && (
        <Animated.View style={[styles.rocketWrapper, { top: topAnim }]}>
          {/* Rocket on top, flame below (engine exhaust) */}
          <Image
            source={require('@/assets/rocket/rocket.png')}
            style={styles.rocket}
          />
          {isAscending && (
            <Image
              source={FLAME_SOURCES[flameIdx]}
              style={styles.flame}
              resizeMode="contain"
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    overflow: 'visible',
  },
  moon: {
    width: MOON_SIZE,
    height: MOON_SIZE,
  },
  landing: {
    marginTop: -10,
    width: LANDING_SIZE,
    height: LANDING_SIZE,
  },
  congrats: {  
    width: CONGRATS_W,
    height: CONGRATS_W,
  },
  rocketWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rocket: {
    width: ROCKET_W,
    height: ROCKET_H,
  },
  flame: {
    width: FLAME_W,
    height: FLAME_W,
    marginTop: -8,
  },
});
