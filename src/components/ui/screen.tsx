import Animated, { FadeIn } from 'react-native-reanimated';
import { useMotionReduced } from '@/contexts/motion-context';
import { MotionPressable } from '@/components/ui/motion-pressable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** A shared, safe-area-aware canvas for phone, tablet and web screens. */
export function Screen({
  children,
  style,
  tab = false,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; tab?: boolean }>) {
  const theme = useTheme();
  const reduced = useMotionReduced();
  return (
    <SafeAreaView
      edges={tab ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(180)}
        style={[styles.page, style]}
      >
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  action,
  back = true,
}: {
  title: string;
  action?: ReactNode;
  back?: boolean;
}) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={styles.header}>
      {back && (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={({ pressed }) => [
            styles.back,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={21} color={theme.text} />
        </MotionPressable>
      )}
      <ThemedText accessibilityRole="header" style={[styles.headerTitle, !back && styles.tabTitle]}>
        {title}
      </ThemedText>
      {action ?? (back ? <View style={styles.spacer} /> : null)}
    </View>
  );
}

export function ScreenIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.intro}>
      {eyebrow && (
        <ThemedText style={[styles.eyebrow, { color: theme.primary }]}>
          {eyebrow.toUpperCase()}
        </ThemedText>
      )}
      <ThemedText accessibilityRole="header" style={styles.title}>
        {title}
      </ThemedText>
      {description && (
        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 60,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 44 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  tabTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -1, textAlign: 'left' },
  intro: { paddingTop: 12, paddingBottom: 20, gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -1 },
  description: { fontSize: 13, lineHeight: 20, maxWidth: 440 },
});
