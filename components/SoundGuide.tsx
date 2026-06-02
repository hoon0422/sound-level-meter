import * as SGIcon from '@/assets/icons/sound-guide';
import { useTheme } from '@/context/ThemeContext';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import useCalibrationStore, { applyCalibrationOffset } from '@/store/calibrationStore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Surface from './Surface';

const ROW_HEIGHT = 26;
const GUIDE_WIDTH = 320;
const GUIDE_HEIGHT = 180;
const GUIDE_CONTENT_HEIGHT = GUIDE_HEIGHT;
const CURRENT_SLOT_TOP = (GUIDE_CONTENT_HEIGHT - ROW_HEIGHT) / 2;
const RANGE_COUNT = 10;
const DEFAULT_WHEEL_Y = (GUIDE_CONTENT_HEIGHT - RANGE_COUNT * ROW_HEIGHT) / 2;
const OPACITY_INPUT_OFFSETS = [4, 3, 2, 1, 0, -1, -2, -3, -4];
const OPACITY_OUTPUT_RANGE = [0, 0.2, 0.4, 0.6, 1, 0.8, 0.6, 0.2, 0];

export default function SoundGuide() {
  const { colors } = useTheme();
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const { dbfs, hasMeasurement } = useThrottledAudioMeterValue(state => ({
    dbfs: state.dbfs,
    hasMeasurement: state.elapsedSeconds > 0,
  }));
  const displayDb = applyCalibrationOffset(dbfs, offsetDb);
  const [isFirstActiveIndex, setIsFirstActiveIndex] = useState(true);
  const animatedY = useRef(new Animated.Value(DEFAULT_WHEEL_Y)).current;
  const ranges = useRanges();
  const activeIndex =
    hasMeasurement && displayDb > 0
      ? ranges.find(range => displayDb >= range.min && displayDb < range.max)?.index
      : undefined;

  useEffect(() => {
    const nextY = activeIndex !== undefined ? CURRENT_SLOT_TOP - activeIndex * ROW_HEIGHT : DEFAULT_WHEEL_Y;

    if (activeIndex === undefined) {
      animatedY.stopAnimation();
      animatedY.setValue(DEFAULT_WHEEL_Y);
      setIsFirstActiveIndex(true);
    } else {
      if (isFirstActiveIndex) {
        setIsFirstActiveIndex(false);
      }

      Animated.timing(animatedY, {
        toValue: nextY,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, animatedY, isFirstActiveIndex]);

  return (
    <Surface style={styles.container}>
      <View style={styles.viewport}>
        {hasMeasurement && activeIndex !== undefined && !isFirstActiveIndex && (
          <View
            style={[
              styles.currentSoundSlot,
              {
                backgroundColor: colors.soundGuideSlot,
                borderColor: colors.shadow,
                shadowColor: colors.shadow,
              },
            ]}
          />
        )}
        <Animated.View style={[styles.listContainer, { transform: [{ translateY: animatedY }] }]}>
          {ranges.map(range => {
            const isActive = activeIndex === range.index;
            const itemOpacityInterpolation = {
              opacity:
                activeIndex !== undefined
                  ? animatedY.interpolate({
                      inputRange: OPACITY_INPUT_OFFSETS.map(
                        offset => CURRENT_SLOT_TOP - (range.index + offset) * ROW_HEIGHT
                      ),
                      outputRange: OPACITY_OUTPUT_RANGE,
                      extrapolate: 'clamp',
                    })
                  : animatedY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0.4],
                      extrapolate: 'clamp',
                    }),
            };

            return (
              <Animated.View key={range.index} style={[styles.row, itemOpacityInterpolation]}>
                {/* DB Value Column */}
                <View style={styles.dBLevelContainer}>
                  <Text
                    style={[
                      isActive ? styles.activeText : styles.text,
                      { color: isActive ? colors.text : colors.inactive },
                    ]}
                  >
                    {range.display}dB
                  </Text>
                </View>

                {/* Description Label */}
                <View style={styles.iconContainer}>
                  {React.isValidElement(range.icon)
                    ? React.cloneElement(range.icon, {
                        color: isActive ? colors.text : colors.inactive,
                        width: isActive ? 20 : 16,
                        height: isActive ? 20 : 16,
                      } as { color: string; width: number; height: number })
                    : range.icon}
                </View>
                <View style={styles.descriptionContainer}>
                  <Text
                    style={[
                      isActive ? styles.activeText : styles.text,
                      { color: isActive ? colors.text : colors.inactive },
                    ]}
                    numberOfLines={1}
                  >
                    {range.label}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </Surface>
  );
}

const RANDOM_TEXT_ID = Math.floor(Math.random() * 4); // 0-3
const TEXT_ID_TO_ICON = [
  {
    lt30: <SGIcon.QuiteForestIcon />,
    db30: <SGIcon.ResidentialAreaAtMidnightIcon />,
    db40: <SGIcon.QuiteCafeIcon />,
    db50: <SGIcon.QuiteOfficeIcon />,
    db60: <SGIcon.NormalConversationIcon />,
    db70: <SGIcon.PhoneRingtoneIcon />,
    db80: <SGIcon.NoiseInsideSubwayIcon />,
    db90: <SGIcon.NoisyFactoryIcon />,
    db100: <SGIcon.NoiseOfPassingTrainIcon />,
    gt110: <SGIcon.RockBandVenueIcon />,
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
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    borderRadius: 10,
    padding: 10,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 10,
  },
  listContainer: {
    paddingHorizontal: 12,
  },
  currentSoundSlot: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: CURRENT_SLOT_TOP,
    height: ROW_HEIGHT,
    borderWidth: 0,
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
  },
  dBLevelContainer: {
    width: 52,
    alignItems: 'flex-end',
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginLeft: 18,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionContainer: {
    flex: 1,
    minWidth: 0,
  },
  text: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 18,
  },
  activeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    lineHeight: 20,
  },
});
