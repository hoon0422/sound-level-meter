import { captureSentryException, getSentryErrorAttributes, logSentryError } from '@/analytics/sentry';
import { DEFAULT_CONFIG } from '@/audio/constants';
import { requestRecordingSession } from '@/audio/recordingSession';
import { useTheme } from '@/context/ThemeContext';
import { useThrottledAudioMeterValue } from '@/hooks/useThrottledAudioMeterValue';
import { navigateBackFromSettings } from '@/navigation/settings';
import { audioMeterStore, useAudioMeterStore } from '@/store/audioMeterStore';
import useCalibrationStore, {
  CALIBRATION_OFFSET_MAX_DB,
  CALIBRATION_OFFSET_MIN_DB,
  applyCalibrationOffset,
  formatCalibrationOffset,
} from '@/store/calibrationStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HOLD_START_DELAY_MS = 350;
const HOLD_REPEAT_MS = 80;
const UNAVAILABLE_READING = '—';
const FIGMA = {
  sideMargin: 29,
  cardWidth: 335,
  infoHeight: 150,
  currentHeight: 202,
  offsetHeight: 259,
  cardGap: 37,
  cardRadius: 10,
  infoIconX: 10,
  infoIconSize: 35,
  infoTextX: 60,
  infoTextY: 21,
  infoTextWidth: 263,
  infoTextGap: 11,
  panelLabelX: 25,
  panelLabelY: 21,
  currentReadoutGap: 28,
  offsetReadoutGap: 44,
  offsetControlsGap: 8,
  controlsWidth: 280,
  controlsHeight: 73,
  controlsButtonX: 27,
  controlsPlusX: 192,
  controlsButtonY: 14,
  controlsButtonWidth: 65,
  controlsButtonHeight: 45,
  controlsDividerX: 142,
  controlsDividerY: 12,
  controlsDividerHeight: 49,
} as const;

type OffsetDirection = 'decrement' | 'increment';

function ImportantIcon() {
  return (
    <Image
      source={require('@/assets/icons/calibration-important.png')}
      style={{ width: FIGMA.infoIconSize, height: FIGMA.infoIconSize }}
    />
  );
}

function AdjustmentIcon({ color, type }: { color: string; type: 'minus' | 'plus' }) {
  const length = 27;
  const thickness = 5;

  return (
    <View style={{ width: 35, height: 35, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: length, height: thickness, borderRadius: thickness / 2, backgroundColor: color }} />
      {type === 'plus' && (
        <View
          style={{
            position: 'absolute',
            width: thickness,
            height: length,
            borderRadius: thickness / 2,
            backgroundColor: color,
          }}
        />
      )}
    </View>
  );
}

export default function CalibrationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { themeName } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDark = themeName === 'dark';
  const [hasMicAccess, setHasMicAccess] = useState(true);
  const startedCalibrationRecordingRef = useRef(false);
  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { configureAudioMetrics, configureSpectrum, start, stop } = useAudioMeterStore(state => ({
    configureAudioMetrics: state.configureAudioMetrics,
    configureSpectrum: state.configureSpectrum,
    start: state.start,
    stop: state.stop,
  }));
  const { dbfs, elapsedSeconds, isRunning } = useThrottledAudioMeterValue(state => ({
    dbfs: state.dbfs,
    elapsedSeconds: state.elapsedSeconds,
    isRunning: state.isRunning,
  }));
  const offsetDb = useCalibrationStore(state => state.offsetDb);
  const decrementOffset = useCalibrationStore(state => state.decrementOffset);
  const incrementOffset = useCalibrationStore(state => state.incrementOffset);

  const currentDb = isRunning && elapsedSeconds > 0 ? applyCalibrationOffset(dbfs, offsetDb) : null;
  const canDecrement = offsetDb > CALIBRATION_OFFSET_MIN_DB;
  const canIncrement = offsetDb < CALIBRATION_OFFSET_MAX_DB;
  const currentValueText = hasMicAccess && currentDb !== null ? currentDb.toFixed(1) : UNAVAILABLE_READING;
  const offsetValueText = formatCalibrationOffset(offsetDb).replace(' dB', '');
  const descriptionParts = [t('settings.calibration.description1'), t('settings.calibration.description2')];

  const dynamicStyles = useMemo(() => {
    const contentWidth = FIGMA.cardWidth;
    const pageBackground = isDark ? '#292929' : '#F8F8F5';
    const textColor = isDark ? '#E0E0E0' : '#000000';
    const secondaryTextColor = isDark ? '#E0E0E0' : '#434343';
    const panelBackground = isDark ? '#434343' : '#FFFFFF';
    const panelBorder = isDark ? 'rgba(186, 186, 186, 0.2)' : '#BABABA';
    const controlBackground = isDark ? '#201E1E' : '#FFFFFF';
    const controlButtonBackground = isDark ? '#434343' : '#ECECEC';
    const controlBorder = isDark ? 'rgba(217, 217, 217, 0.2)' : '#D9D9D9';

    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: pageBackground,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: insets.top + 18,
        paddingBottom: 22,
        paddingHorizontal: FIGMA.sideMargin,
        backgroundColor: pageBackground,
      },
      title: {
        flex: 1,
        color: textColor,
        fontFamily: 'DMSans_500Medium',
        fontSize: 24,
      },
      content: {
        alignItems: 'flex-start',
        paddingTop: 0,
        paddingLeft: FIGMA.sideMargin,
        paddingRight: FIGMA.sideMargin,
        paddingBottom: Math.max(insets.bottom, 0),
      },
      infoPanel: {
        width: contentWidth,
        borderWidth: isDark ? 0 : 1,
        borderColor: '#FFDF9E',
        borderRadius: FIGMA.cardRadius,
        backgroundColor: isDark ? panelBackground : '#FCF8EB',
        flexDirection: 'row',
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 10,
        paddingRight: 20,
      },
      infoIcon: {
        width: FIGMA.infoIconSize,
        height: FIGMA.infoIconSize,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: FIGMA.infoTextX - FIGMA.infoIconX - FIGMA.infoIconSize,
      },
      infoTextColumn: {
        flex: 1,
      },
      infoText: {
        color: textColor,
        fontFamily: 'DMSans_500Medium',
        fontSize: 13,
        lineHeight: 22,
      },
      infoTextSpacing: {
        marginTop: FIGMA.infoTextGap,
      },
      panel: {
        width: contentWidth,
        borderWidth: 1,
        borderColor: panelBorder,
        borderRadius: FIGMA.cardRadius,
        backgroundColor: panelBackground,
        paddingTop: FIGMA.panelLabelY,
        paddingHorizontal: FIGMA.panelLabelX,
      },
      currentPanel: {
        height: FIGMA.currentHeight,
        marginTop: FIGMA.cardGap,
      },
      offsetPanel: {
        height: FIGMA.offsetHeight,
        marginTop: FIGMA.cardGap,
      },
      label: {
        color: secondaryTextColor,
        fontFamily: 'DMSans_500Medium',
        fontSize: 16,
        lineHeight: 22,
      },
      currentReadout: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: FIGMA.currentReadoutGap,
      },
      currentValue: {
        color: '#73B024',
        fontFamily: 'DMSans_700Bold',
        fontSize: 93,
        lineHeight: 100,
        maxWidth: contentWidth - 113,
      },
      currentUnit: {
        color: '#73B024',
        fontFamily: 'DMSans_500Medium',
        fontSize: 48,
        lineHeight: 52,
        marginLeft: 8,
        marginBottom: 10,
      },
      offsetReadout: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: FIGMA.offsetReadoutGap,
      },
      offsetValue: {
        color: textColor,
        fontFamily: 'DMSans_500Medium',
        fontSize: 64,
        lineHeight: 70,
        maxWidth: contentWidth - 84,
      },
      offsetUnit: {
        color: isDark ? textColor : '#8D8D8D',
        fontFamily: 'DMSans_500Medium',
        fontSize: 32,
        lineHeight: 35,
        marginLeft: 8,
        marginBottom: 6,
      },
      controls: {
        width: FIGMA.controlsWidth,
        height: FIGMA.controlsHeight,
        borderRadius: FIGMA.cardRadius,
        borderWidth: 1,
        borderColor: controlBorder,
        backgroundColor: controlBackground,
        marginTop: FIGMA.offsetControlsGap,
        position: 'relative',
      },
      controlButton: {
        position: 'absolute',
        top: FIGMA.controlsButtonY,
        width: FIGMA.controlsButtonWidth,
        height: FIGMA.controlsButtonHeight,
        borderRadius: FIGMA.cardRadius,
        backgroundColor: controlButtonBackground,
        alignItems: 'center',
        justifyContent: 'center',
      },
      decrementButton: {
        left: FIGMA.controlsButtonX,
      },
      incrementButton: {
        left: FIGMA.controlsPlusX,
      },
      controlDivider: {
        position: 'absolute',
        left: FIGMA.controlsDividerX,
        top: FIGMA.controlsDividerY,
        width: 1,
        height: FIGMA.controlsDividerHeight,
        backgroundColor: controlBorder,
      },
      controlButtonDisabled: {
        opacity: 0.35,
      },
    });
  }, [insets.bottom, insets.top, isDark]);

  const clearHoldTimers = useCallback(() => {
    if (holdDelayRef.current) {
      clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const changeOffset = useCallback(
    (direction: OffsetDirection) => {
      if (direction === 'decrement') {
        decrementOffset();
        return;
      }
      incrementOffset();
    },
    [decrementOffset, incrementOffset]
  );

  const startHold = useCallback(
    (direction: OffsetDirection, enabled: boolean) => {
      if (!enabled) return;
      changeOffset(direction);
      clearHoldTimers();
      holdDelayRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => changeOffset(direction), HOLD_REPEAT_MS);
      }, HOLD_START_DELAY_MS);
    },
    [changeOffset, clearHoldTimers]
  );

  useEffect(
    () => () => {
      clearHoldTimers();
    },
    [clearHoldTimers]
  );

  useEffect(() => {
    let isActive = true;

    async function startCalibrationRecordingIfNeeded() {
      try {
        if (audioMeterStore.getState().isRunning) {
          return;
        }

        const canRecord = await requestRecordingSession();
        if (!isActive) return;
        setHasMicAccess(canRecord);
        if (!canRecord) {
          return;
        }

        configureSpectrum(DEFAULT_CONFIG);
        configureAudioMetrics(DEFAULT_CONFIG);
        const didStart = await start(DEFAULT_CONFIG, { sessionMode: 'calibration' });
        if (!isActive) {
          if (didStart) {
            stop();
          }
          return;
        }

        startedCalibrationRecordingRef.current = didStart;
      } catch (error) {
        logSentryError('Calibration recording start failed', getSentryErrorAttributes(error));
        captureSentryException(error, 'Calibration recording start failed');
        if (isActive) {
          setHasMicAccess(false);
        }
      }
    }

    startCalibrationRecordingIfNeeded().catch(error => {
      logSentryError('Calibration recording task failed', getSentryErrorAttributes(error));
      captureSentryException(error, 'Calibration recording task failed');
    });

    return () => {
      isActive = false;
      if (startedCalibrationRecordingRef.current) {
        stop();
      }
    };
  }, [configureAudioMetrics, configureSpectrum, start, stop]);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Pressable onPress={() => navigateBackFromSettings(router)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#E0E0E0' : '#000000'} />
        </Pressable>
        <Text allowFontScaling={false} style={dynamicStyles.title}>
          {t('settings.calibration.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={dynamicStyles.content}
        scrollEnabled={height < 780}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.infoPanel}>
          <View style={dynamicStyles.infoIcon}>
            <ImportantIcon />
          </View>
          <View style={dynamicStyles.infoTextColumn}>
            <Text style={dynamicStyles.infoText}>{descriptionParts[0]}</Text>
            {descriptionParts.slice(1).map((part, index) => (
              <Text key={`${part}-${index}`} style={[dynamicStyles.infoText, dynamicStyles.infoTextSpacing]}>
                {part}
              </Text>
            ))}
          </View>
        </View>

        <View style={[dynamicStyles.panel, dynamicStyles.currentPanel]}>
          <Text style={dynamicStyles.label}>{t('settings.calibration.currentDb')}</Text>
          <View style={dynamicStyles.currentReadout}>
            <Text adjustsFontSizeToFit allowFontScaling={false} numberOfLines={1} style={dynamicStyles.currentValue}>
              {currentValueText}
            </Text>
            {currentValueText !== UNAVAILABLE_READING && (
              <Text allowFontScaling={false} style={dynamicStyles.currentUnit}>
                dB
              </Text>
            )}
          </View>
        </View>

        <View style={[dynamicStyles.panel, dynamicStyles.offsetPanel]}>
          <Text style={dynamicStyles.label}>{t('settings.calibration.offset')}</Text>
          <View style={dynamicStyles.offsetReadout}>
            <Text adjustsFontSizeToFit allowFontScaling={false} numberOfLines={1} style={dynamicStyles.offsetValue}>
              {offsetValueText}
            </Text>
            <Text allowFontScaling={false} style={dynamicStyles.offsetUnit}>
              dB
            </Text>
          </View>
          <View style={dynamicStyles.controls}>
            <Pressable
              accessibilityLabel={t('settings.calibration.decrease')}
              disabled={!canDecrement}
              onPressIn={() => startHold('decrement', canDecrement)}
              onPressOut={clearHoldTimers}
              style={[
                dynamicStyles.controlButton,
                dynamicStyles.decrementButton,
                !canDecrement && dynamicStyles.controlButtonDisabled,
              ]}
            >
              <AdjustmentIcon color={isDark ? '#EFEFEF' : '#434343'} type="minus" />
            </Pressable>
            <View style={dynamicStyles.controlDivider} />
            <Pressable
              accessibilityLabel={t('settings.calibration.increase')}
              disabled={!canIncrement}
              onPressIn={() => startHold('increment', canIncrement)}
              onPressOut={clearHoldTimers}
              style={[
                dynamicStyles.controlButton,
                dynamicStyles.incrementButton,
                !canIncrement && dynamicStyles.controlButtonDisabled,
              ]}
            >
              <AdjustmentIcon color={isDark ? '#EFEFEF' : '#434343'} type="plus" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: 12,
  },
});
