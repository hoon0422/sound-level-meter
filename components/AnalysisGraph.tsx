import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import WhiteContainer from './WhiteContainer';

const ROW_HEIGHT = 18;
const RANGES = [
  { min: 0, max: 20, label: 'Barely audible', display: '<20' },
  { min: 20, max: 30, label: 'Quiet forest', display: '30' },
  { min: 30, max: 40, label: 'Library', display: '40' },
  { min: 40, max: 50, label: 'Light rainfall', display: '50' },
  { min: 50, max: 60, label: 'Casual talk', display: '60' },
  { min: 60, max: 70, label: 'Busy street', display: '70' },
  { min: 70, max: 80, label: 'Heavy traffic', display: '80' },
  { min: 80, max: 90, label: 'Subway', display: '90' },
  { min: 90, max: 100, label: 'Plane taking off', display: '100' },
  { min: 100, max: 150, label: 'Danger zone', display: '>110' },
].map((range, index) => ({ ...range, index }));

export default function AnalysisGraph() {
  const isRunning = useAudioMeterStore(state => state.isRunning && state.dbfs > 0);
  const dbfs = useThrottledAudioMeterValue(state => state.dbfs);
  const activeIndex = isRunning ? RANGES.find(range => dbfs >= range.min && dbfs < range.max)?.index : undefined;
  const [isFirstActiveIndex, setIsFirstActiveIndex] = useState(true);
  const animatedY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeIndex === undefined) {
      // stopped
      setIsFirstActiveIndex(true);
    } else if (isFirstActiveIndex) {
      // first time active
      animatedY.setValue(activeIndex * ROW_HEIGHT - 1);
      setIsFirstActiveIndex(false);
    } else {
      Animated.timing(animatedY, {
        toValue: activeIndex * ROW_HEIGHT - 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, animatedY, isFirstActiveIndex]);

  return (
    <WhiteContainer style={styles.container}>
      {activeIndex !== undefined && !isFirstActiveIndex && (
        <Animated.View style={[styles.highlightRow, { transform: [{ translateY: animatedY }] }]} />
      )}
      <View style={styles.listContainer}>
        {RANGES.map(range => {
          const itemOpacityInterpolation = {
            opacity:
              activeIndex !== undefined
                ? animatedY.interpolate({
                    inputRange: [
                      (range.index - 1) * ROW_HEIGHT,
                      range.index * ROW_HEIGHT,
                      (range.index + 1) * ROW_HEIGHT,
                    ],
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                  })
                : animatedY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.4],
                    extrapolate: 'clamp',
                  }),
          };

          return (
            <View key={range.index} style={styles.row}>
              {/* DB Value Column */}
              <View style={styles.dBLevelContainer}>
                <Animated.Text style={[styles.text, itemOpacityInterpolation].filter(Boolean)}>
                  {range.display}dB
                </Animated.Text>
              </View>

              {/* Description Label */}
              <View style={styles.descriptionContainer}>
                <Animated.Text style={[styles.text, itemOpacityInterpolation].filter(Boolean)} numberOfLines={1}>
                  {range.label}
                </Animated.Text>
              </View>
            </View>
          );
        })}
      </View>
    </WhiteContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  listContainer: {
    paddingLeft: 70,
    paddingRight: 45,
  },
  highlightRow: {
    ...StyleSheet.absoluteFillObject,
    height: ROW_HEIGHT - 1,
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
    boxShadow: '2px 1px 0px 0px rgba(51, 51, 51, 1)',
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 60,
    height: ROW_HEIGHT,
  },
  dBLevelContainer: {
    width: 38,
    alignItems: 'flex-end',
  },
  descriptionContainer: {
    width: 87,
  },
  text: {
    fontSize: 10,
    color: '#333',
    opacity: 0.4,
  },
});
