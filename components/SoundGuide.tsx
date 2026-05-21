import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { useAudioMeterStore } from '@/store/audioMeterStore';
import * as SGIcon from '@assets/icons/sound-guide';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';
import WhiteContainer from './WhiteContainer';

const ROW_HEIGHT = 18;

export default function SoundGuide() {
  const isRunning = useAudioMeterStore(state => state.isRunning && state.dbfs > 0);
  const dbfs = useThrottledAudioMeterValue(state => state.dbfs);
  const [isFirstActiveIndex, setIsFirstActiveIndex] = useState(true);
  const animatedY = useRef(new Animated.Value(0)).current;
  const ranges = useRanges();
  const activeIndex = isRunning ? ranges.find(range => dbfs >= range.min && dbfs < range.max)?.index : undefined;

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
        {ranges.map(range => {
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
              <Animated.View style={[styles.descriptionContainer, ...[itemOpacityInterpolation].filter(Boolean)]}>
                <Text style={styles.text}>{range.icon}</Text>
                <Text style={styles.text} numberOfLines={1}>
                  {range.label}
                </Text>
              </Animated.View>
            </View>
          );
        })}
      </View>
    </WhiteContainer>
  );
}

const RANDOM_TEXT_ID = Math.floor(Math.random() * 4); // 0-3
const TEXT_ID_TO_ICON = [
  {
    lt30: <SGIcon.TempIcon />,
    db30: <SGIcon.TempIcon />,
    db40: <SGIcon.TempIcon />,
    db50: <SGIcon.TempIcon />,
    db60: <SGIcon.TempIcon />,
    db70: <SGIcon.TempIcon />,
    db80: <SGIcon.TempIcon />,
    db90: <SGIcon.TempIcon />,
    db100: <SGIcon.TempIcon />,
    gt110: <SGIcon.TempIcon />,
  },
  {
    lt30: <SGIcon.RustingLeavesIcon />,
    db30: <SGIcon.VerySoftWhisperIcon />,
    db40: <SGIcon.ResidentialAreaByDayIcon />,
    db50: <SGIcon.RefrigeratorHumIcon />,
    db60: <SGIcon.DepartmentStoreNoiseIcon />,
    db70: <SGIcon.NoisyOfficeIcon />,
    db80: <SGIcon.RoadsideRailwayNoiseIcon />,
    db90: <SGIcon.ExcavatorNoiseIcon />,
    db100: <SGIcon.ElectricDrillSoundIcon />,
    gt110: <SGIcon.AirplaneTakeoffLandingIcon />,
  },
  {
    lt30: <SGIcon.ClockTickingIcon />,
    db30: <SGIcon.InsideALibraryIcon />,
    db40: <SGIcon.LightRainSoundIcon />,
    db50: <SGIcon.SoftConversationIcon />,
    db60: <SGIcon.WashingMachineNoiseIcon />,
    db70: <SGIcon.VacuumCleanerNoiseIcon />,
    db80: <SGIcon.InsideNoisyFactoryIcon />,
    db90: <SGIcon.HeavyTruckTrafficIcon />,
    db100: <SGIcon.CarHornSoundIcon />,
    gt110: <SGIcon.ThunderSoundIcon />,
  },
  {
    lt30: <SGIcon.FallingSnowIcon />,
    db30: <SGIcon.GentleBreezeIcon />,
    db40: <SGIcon.QuiteParkIcon />,
    db50: <SGIcon.QuiteCafeIcon />,
    db60: <SGIcon.QuiteRestaurantIcon />,
    db70: <SGIcon.BusyStreetIcon />,
    db80: <SGIcon.BlenderIcon />,
    db90: <SGIcon.LawnmowerIcon />,
    db100: <SGIcon.ChainsawIcon />,
    gt110: <SGIcon.NearbyFireEngineSirenIcon />,
  },
];

const useRanges = () => {
  const { t } = useTranslation();
  return useMemo(
    () =>
      [
        { min: 0, max: 30, tKey: 'lt30', display: '<30' },
        { min: 30, max: 40, tKey: 'db30', display: '30' },
        { min: 40, max: 50, tKey: 'db40', display: '40' },
        { min: 50, max: 60, tKey: 'db50', display: '50' },
        { min: 60, max: 70, tKey: 'db60', display: '60' },
        { min: 70, max: 80, tKey: 'db70', display: '70' },
        { min: 80, max: 90, tKey: 'db80', display: '80' },
        { min: 90, max: 100, tKey: 'db90', display: '90' },
        { min: 100, max: 110, tKey: 'db100', display: '100' },
        { min: 110, max: 150, tKey: 'gt110', display: '>110' },
      ].map((range, index) => ({
        min: range.min,
        max: range.max,
        label: t(`soundGuide.${RANDOM_TEXT_ID}.${range.tKey}`),
        display: range.display,
        icon: TEXT_ID_TO_ICON[RANDOM_TEXT_ID][range.tKey as keyof (typeof TEXT_ID_TO_ICON)[0]],
        index,
      })),
    [t]
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  listContainer: {
    paddingLeft: 40,
    paddingRight: 25,
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
    gap: 50,
    height: ROW_HEIGHT,
  },
  dBLevelContainer: {
    width: 38,
    alignItems: 'flex-end',
  },
  descriptionContainer: {
    width: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 10,
    color: '#333',
  },
});
