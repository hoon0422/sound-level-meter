import DeleteIcon from '@/app/assets/icons/delete.svg';
import { useTheme } from '@/context/ThemeContext';
import { RecordingLog } from '@/store/logsStore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const ACTION_WIDTH = 66;
const ACTION_OVERLAP = 12;
const CARD_RADIUS = 10;
const DELETE_DURATION_MS = 220;
const RESET_DURATION_MS = 180;

type RecordingLogCardProps = {
  index: number;
  item: RecordingLog;
  logCount: number;
  onDelete: (id: string) => void;
  resetSignal: number;
};

export function RecordingLogCard({ index, item, logCount, onDelete, resetSignal }: RecordingLogCardProps) {
  const { colors, themeName } = useTheme();
  const { t } = useTranslation();
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const translateX = useSharedValue(0);
  const gestureStartX = useSharedValue(0);
  const rowHeight = useSharedValue(0);
  const rowOpacity = useSharedValue(1);

  const cardBorderColor = themeName === 'dark' ? colors.inactive : colors.border;
  const cardShadowColor = themeName === 'dark' ? colors.inactive : colors.shadow;

  useEffect(() => {
    translateX.value = withTiming(0, { duration: RESET_DURATION_MS });
  }, [resetSignal, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      gestureStartX.value = translateX.value;
    })
    .onUpdate(event => {
      const nextX = Math.min(0, Math.max(-ACTION_WIDTH, gestureStartX.value + event.translationX));
      translateX.value = nextX;
    })
    .onEnd(() => {
      const shouldOpen = translateX.value < -ACTION_WIDTH / 2;
      translateX.value = withTiming(shouldOpen ? -ACTION_WIDTH : 0, { duration: RESET_DURATION_MS });
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    height: measuredHeight === 0 ? undefined : rowHeight.value,
    opacity: rowOpacity.value,
  }));

  const handleDelete = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    translateX.value = withTiming(-ACTION_WIDTH - 24, { duration: DELETE_DURATION_MS });
    rowOpacity.value = withTiming(0, { duration: DELETE_DURATION_MS });
    rowHeight.value = withTiming(0, { duration: DELETE_DURATION_MS });

    setTimeout(() => {
      onDelete(item.id);
    }, DELETE_DURATION_MS);
  };

  return (
    <Animated.View
      style={[styles.rowClip, measuredHeight > 0 && containerAnimatedStyle]}
      onLayout={event => {
        if (measuredHeight === 0) {
          const nextHeight = event.nativeEvent.layout.height;
          setMeasuredHeight(nextHeight);
          rowHeight.value = nextHeight;
        }
      }}
    >
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('log.deleteRecord')}
          disabled={isDeleting}
          onPress={handleDelete}
          style={[styles.deleteAction, { backgroundColor: colors.loud }]}
        >
          <DeleteIcon width={22} height={22} color="#FDFCFA" />
        </Pressable>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: cardBorderColor,
                shadowColor: cardShadowColor,
              },
              cardAnimatedStyle,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardIndex, { color: colors.text }]}>#{logCount - index}</Text>
              <Text style={[styles.cardDate, { color: colors.text }]}>{item.date}</Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: themeName === 'dark' ? colors.inactive : colors.divider }]}
            />

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{t('log.duration')}</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{item.duration}</Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: themeName === 'dark' ? colors.inactive : colors.divider },
                ]}
              />
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{t('stats.max')}</Text>
                <Text style={[styles.statValue, { color: colors.loud }]}>{item.maxDb} dB</Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: themeName === 'dark' ? colors.inactive : colors.divider },
                ]}
              />
              <View style={styles.stat}>
                <Text style={[styles.statLabel, { color: colors.text }]}>{t('stats.average')}</Text>
                <Text style={[styles.statValue, { color: colors.quiet }]}>{item.avgDb} dB</Text>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rowClip: {
    overflow: 'hidden',
  },
  row: {
    justifyContent: 'center',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH + ACTION_OVERLAP,
    paddingLeft: ACTION_OVERLAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 20,
    borderWidth: 1,
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  cardIndex: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});
