import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: theme.border },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <Animated.View style={styles.card}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <Animated.View style={styles.cardContent}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} style={styles.gap} />
      </Animated.View>
      <Skeleton width={60} height={14} />
    </Animated.View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <Animated.View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  gap: {
    marginTop: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.xl,
  },
});
