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
import useRecordingLogControlStore from '@/store/recordingLogControlStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const HOLD_START_DELAY_MS = 350;
const HOLD_REPEAT_MS = 80;
const UNAVAILABLE_READING = '—';

type OffsetDirection = 'decrement' | 'increment';

export default function CalibrationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const [hasMicAccess, setHasMicAccess] = useState(true);
  const startedTemporaryMeasurementRef = useRef(false);
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
  const markNextRecordingStopAsTemporary = useRecordingLogControlStore(state => state.markNextRecordingStopAsTemporary);

  const currentDb = isRunning && elapsedSeconds > 0 ? applyCalibrationOffset(dbfs, offsetDb) : null;
  const canDecrement = offsetDb > CALIBRATION_OFFSET_MIN_DB;
  const canIncrement = offsetDb < CALIBRATION_OFFSET_MAX_DB;

  const dynamicStyles = useMemo(() => {
    const horizontalPadding = isTablet ? 40 : 20;
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: insets.top + 8,
        paddingBottom: isTablet ? 25 : 20,
        paddingHorizontal: horizontalPadding,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      title: {
        flex: 1,
        color: colors.text,
        fontFamily: 'DMSans_700Bold',
        fontSize: isTablet ? 32 : 24,
      },
      content: {
        paddingHorizontal: horizontalPadding,
        paddingTop: isTablet ? 28 : 20,
        paddingBottom: 32,
        gap: 16,
      },
      infoPanel: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.surface,
        padding: isTablet ? 18 : 14,
        gap: 8,
      },
      infoText: {
        color: colors.text,
        fontFamily: 'DMSans_400Regular',
        fontSize: isTablet ? 16 : 14,
        lineHeight: isTablet ? 23 : 20,
      },
      panel: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.surface,
        paddingVertical: isTablet ? 28 : 24,
        paddingHorizontal: isTablet ? 24 : 18,
        alignItems: 'center',
      },
      label: {
        color: colors.text,
        fontFamily: 'DMSans_500Medium',
        fontSize: isTablet ? 22 : 19,
        textAlign: 'center',
      },
      currentValue: {
        color: colors.quiet,
        fontFamily: 'DMSans_700Bold',
        fontSize: isTablet ? 48 : 42,
        lineHeight: isTablet ? 56 : 50,
        textAlign: 'center',
      },
      offsetValue: {
        color: colors.text,
        fontFamily: 'DMSans_700Bold',
        fontSize: isTablet ? 42 : 36,
        lineHeight: isTablet ? 50 : 44,
        marginTop: 6,
        textAlign: 'center',
      },
      controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 260,
        marginTop: 28,
      },
      controlButton: {
        width: isTablet ? 76 : 64,
        height: isTablet ? 64 : 56,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      },
      controlButtonDisabled: {
        opacity: 0.35,
      },
    });
  }, [colors, insets.top, isTablet]);

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

    async function startTemporaryMeasurementIfNeeded() {
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
        const didStart = await start(DEFAULT_CONFIG);
        if (!isActive) {
          if (didStart) {
            markNextRecordingStopAsTemporary();
            stop();
          }
          return;
        }

        startedTemporaryMeasurementRef.current = didStart;
      } catch (error) {
        logSentryError('Calibration temporary measurement start failed', getSentryErrorAttributes(error));
        captureSentryException(error, 'Calibration temporary measurement start failed');
        if (isActive) {
          setHasMicAccess(false);
        }
      }
    }

    startTemporaryMeasurementIfNeeded().catch(error => {
      logSentryError('Calibration temporary measurement task failed', getSentryErrorAttributes(error));
      captureSentryException(error, 'Calibration temporary measurement task failed');
    });

    return () => {
      isActive = false;
      if (startedTemporaryMeasurementRef.current) {
        markNextRecordingStopAsTemporary();
        stop();
      }
    };
  }, [configureAudioMetrics, configureSpectrum, markNextRecordingStopAsTemporary, start, stop]);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Pressable onPress={() => navigateBackFromSettings(router)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={dynamicStyles.title}>
          {t('settings.calibration.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={dynamicStyles.content}>
        <View style={dynamicStyles.infoPanel}>
          <Text style={dynamicStyles.infoText}>{t('settings.calibration.instructions.reference')}</Text>
          <Text style={dynamicStyles.infoText}>{t('settings.calibration.instructions.location')}</Text>
          <Text style={dynamicStyles.infoText}>{t('settings.calibration.instructions.soundSource')}</Text>
          <Text style={dynamicStyles.infoText}>{t('settings.calibration.instructions.compare')}</Text>
          <Text style={dynamicStyles.infoText}>{t('settings.calibration.instructions.example')}</Text>
          <Text style={dynamicStyles.infoText}>{t('settings.calibration.instructions.freqExcluded')}</Text>
        </View>

        <View style={dynamicStyles.panel}>
          <Text style={dynamicStyles.label}>{t('settings.calibration.currentDb')}</Text>
          <Text style={dynamicStyles.currentValue}>
            {hasMicAccess && currentDb !== null ? `${currentDb.toFixed(1)} dB` : UNAVAILABLE_READING}
          </Text>
        </View>

        <View style={dynamicStyles.panel}>
          <Text style={dynamicStyles.label}>{t('settings.calibration.offset')}</Text>
          <Text style={dynamicStyles.offsetValue}>{formatCalibrationOffset(offsetDb)}</Text>
          <View style={dynamicStyles.controls}>
            <Pressable
              accessibilityLabel={t('settings.calibration.decrease')}
              disabled={!canDecrement}
              onPressIn={() => startHold('decrement', canDecrement)}
              onPressOut={clearHoldTimers}
              style={[dynamicStyles.controlButton, !canDecrement && dynamicStyles.controlButtonDisabled]}
            >
              <Ionicons name="remove" size={34} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityLabel={t('settings.calibration.increase')}
              disabled={!canIncrement}
              onPressIn={() => startHold('increment', canIncrement)}
              onPressOut={clearHoldTimers}
              style={[dynamicStyles.controlButton, !canIncrement && dynamicStyles.controlButtonDisabled]}
            >
              <Ionicons name="add" size={34} color={colors.text} />
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
