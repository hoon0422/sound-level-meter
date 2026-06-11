import { audioVisualValues } from '@/audio/visual/audioVisualValues';
import * as SGIcon from '@/assets/icons/sound-guide';
import { useTheme } from '@/context/ThemeContext';
import useCalibrationStore from '@/store/calibrationStore';
import React, { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import Surface from './Surface';

const ROW_HEIGHT = 26;
const GUIDE_WIDTH = 320;
const GUIDE_HEIGHT = 180;
const GUIDE_CONTENT_HEIGHT = GUIDE_HEIGHT;
const CURRENT_SLOT_TOP = (GUIDE_CONTENT_HEIGHT - ROW_HEIGHT) / 2;
const RANGE_COUNT = 10;
const DEFAULT_WHEEL_Y = (GUIDE_CONTENT_HEIGHT - RANGE_COUNT * ROW_HEIGHT) / 2;
const RANGE_HYSTERESIS_DB = 1.5;
const ANIMATION_DURATION_MS = 180;
const IDLE_ACTIVE_INDEX = -1;
const RANGE_DEFS = [
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
] as const;

type SoundGuideIcon = React.ComponentType<SvgProps>;
type SoundGuideRange = (typeof RANGE_DEFS)[number] & {
  label: string;
  icon: SoundGuideIcon;
  index: number;
};

const RANDOM_TEXT_ID = Math.floor(Math.random() * 4);
const TEXT_ID_TO_ICON = [
  {
    lt30: SGIcon.QuiteForestIcon,
    db30: SGIcon.ResidentialAreaAtMidnightIcon,
    db40: SGIcon.QuiteCafeIcon,
    db50: SGIcon.QuiteOfficeIcon,
    db60: SGIcon.NormalConversationIcon,
    db70: SGIcon.PhoneRingtoneIcon,
    db80: SGIcon.NoiseInsideSubwayIcon,
    db90: SGIcon.NoisyFactoryIcon,
    db100: SGIcon.NoiseOfPassingTrainIcon,
    gt110: SGIcon.RockBandVenueIcon,
  },
  {
    lt30: SGIcon.RustingLeavesIcon,
    db30: SGIcon.VerySoftWhisperIcon,
    db40: SGIcon.ResidentialAreaByDayIcon,
    db50: SGIcon.RefrigeratorHumIcon,
    db60: SGIcon.DepartmentStoreNoiseIcon,
    db70: SGIcon.NoisyOfficeIcon,
    db80: SGIcon.RoadsideRailwayNoiseIcon,
    db90: SGIcon.ExcavatorNoiseIcon,
    db100: SGIcon.ElectricDrillSoundIcon,
    gt110: SGIcon.AirplaneTakeoffLandingIcon,
  },
  {
    lt30: SGIcon.ClockTickingIcon,
    db30: SGIcon.InsideALibraryIcon,
    db40: SGIcon.LightRainSoundIcon,
    db50: SGIcon.SoftConversationIcon,
    db60: SGIcon.WashingMachineNoiseIcon,
    db70: SGIcon.VacuumCleanerNoiseIcon,
    db80: SGIcon.InsideNoisyFactoryIcon,
    db90: SGIcon.HeavyTruckTrafficIcon,
    db100: SGIcon.CarHornSoundIcon,
    gt110: SGIcon.ThunderSoundIcon,
  },
  {
    lt30: SGIcon.FallingSnowIcon,
    db30: SGIcon.GentleBreezeIcon,
    db40: SGIcon.QuiteParkIcon,
    db50: SGIcon.QuiteCafeIcon,
    db60: SGIcon.QuiteRestaurantIcon,
    db70: SGIcon.BusyStreetIcon,
    db80: SGIcon.BlenderIcon,
    db90: SGIcon.LawnmowerIcon,
    db100: SGIcon.ChainsawIcon,
    gt110: SGIcon.NearbyFireEngineSirenIcon,
  },
] satisfies Record<(typeof RANGE_DEFS)[number]['tKey'], SoundGuideIcon>[];

function findRangeIndex(displayDb: number) {
  'worklet';
  for (let i = 0; i < RANGE_DEFS.length; i++) {
    const range = RANGE_DEFS[i];
    if (displayDb >= range.min && displayDb < range.max) {
      return i;
    }
  }
  return IDLE_ACTIVE_INDEX;
}

function findRangeIndexWithHysteresis(displayDb: number, currentIndex: number) {
  'worklet';
  if (currentIndex >= 0 && currentIndex < RANGE_DEFS.length) {
    const currentRange = RANGE_DEFS[currentIndex];
    if (displayDb >= currentRange.min - RANGE_HYSTERESIS_DB && displayDb < currentRange.max + RANGE_HYSTERESIS_DB) {
      return currentIndex;
    }
  }
  return findRangeIndex(displayDb);
}

export default function SoundGuide() {
  const { colors } = useTheme();
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const calibrationOffset = useSharedValue(offsetDb);
  const activeIndex = useSharedValue(IDLE_ACTIVE_INDEX);
  const wheelY = useSharedValue(DEFAULT_WHEEL_Y);
  const ranges = useRanges();

  useEffect(() => {
    calibrationOffset.value = offsetDb;
  }, [calibrationOffset, offsetDb]);

  useAnimatedReaction(
    () => {
      if (!audioVisualValues.hasSignal.value) {
        return IDLE_ACTIVE_INDEX;
      }
      const displayDb = audioVisualValues.displayDb.value + calibrationOffset.value;
      if (displayDb <= 0) {
        return IDLE_ACTIVE_INDEX;
      }
      return findRangeIndexWithHysteresis(displayDb, activeIndex.value);
    },
    nextIndex => {
      activeIndex.value = nextIndex;
      const nextY = nextIndex === IDLE_ACTIVE_INDEX ? DEFAULT_WHEEL_Y : CURRENT_SLOT_TOP - nextIndex * ROW_HEIGHT;
      wheelY.value =
        nextIndex === IDLE_ACTIVE_INDEX ? DEFAULT_WHEEL_Y : withTiming(nextY, { duration: ANIMATION_DURATION_MS });
    }
  );

  const listStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wheelY.value }],
  }));
  const slotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeIndex.value === IDLE_ACTIVE_INDEX ? 0 : 1, { duration: ANIMATION_DURATION_MS }),
  }));

  return (
    <Surface style={styles.container}>
      <View style={styles.viewport}>
        <Animated.View
          style={[
            styles.currentSoundSlot,
            {
              backgroundColor: colors.soundGuideSlot,
              borderColor: colors.shadow,
              shadowColor: colors.shadow,
            },
            slotStyle,
          ]}
        />
        <Animated.View style={[styles.listContainer, listStyle]}>
          {ranges.map(range => (
            <SoundGuideRow
              activeIndex={activeIndex}
              iconColor={colors.text}
              key={range.index}
              range={range}
              textColor={colors.text}
              wheelY={wheelY}
            />
          ))}
        </Animated.View>
      </View>
    </Surface>
  );
}

const SoundGuideRow = memo(function SoundGuideRow({
  activeIndex,
  iconColor,
  range,
  textColor,
  wheelY,
}: {
  activeIndex: SharedValue<number>;
  iconColor: string;
  range: SoundGuideRange;
  textColor: string;
  wheelY: SharedValue<number>;
}) {
  const Icon = range.icon;
  const rowStyle = useAnimatedStyle(() => {
    if (activeIndex.value === IDLE_ACTIVE_INDEX) {
      return { opacity: 0.4 };
    }
    const centeredIndex = (CURRENT_SLOT_TOP - wheelY.value) / ROW_HEIGHT;
    const distance = Math.abs(range.index - centeredIndex);
    return {
      opacity: interpolate(distance, [0, 1, 2, 3, 4], [1, 0.8, 0.6, 0.2, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[styles.row, rowStyle]}>
      <View style={styles.dBLevelContainer}>
        <Text style={[styles.text, { color: textColor }]}>{range.display}dB</Text>
      </View>
      <View style={styles.iconContainer}>
        <Icon color={iconColor} width={16} height={16} />
      </View>
      <View style={styles.descriptionContainer}>
        <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
          {range.label}
        </Text>
      </View>
    </Animated.View>
  );
});

const useRanges = () => {
  const { t } = useTranslation();
  return useMemo<SoundGuideRange[]>(
    () =>
      RANGE_DEFS.map((range, index) => ({
        ...range,
        label: t(`soundGuide.${RANDOM_TEXT_ID}.${range.tKey}`),
        icon: TEXT_ID_TO_ICON[RANDOM_TEXT_ID][range.tKey],
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
    paddingHorizontal: 10,
  },
  currentSoundSlot: {
    position: 'absolute',
    left: 8,
    right: 8,
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
    fontSize: 12,
    lineHeight: 18,
  },
});
