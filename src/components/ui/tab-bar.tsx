import { MotionPressable } from '@/components/ui/motion-pressable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_ICONS: Record<
  string,
  { default: keyof typeof Ionicons.glyphMap; focused: keyof typeof Ionicons.glyphMap }
> = {
  index: { default: 'home-outline', focused: 'home' },
  groups: { default: 'people-outline', focused: 'people' },
  add: { default: 'add', focused: 'add' },
  settle: { default: 'swap-horizontal-outline', focused: 'swap-horizontal' },
  activity: { default: 'time-outline', focused: 'time' },
  profile: { default: 'person-outline', focused: 'person' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || Spacing.sm,
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          if (route.name === 'profile') return null;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const isAdd = route.name === 'add';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconSet = TAB_ICONS[route.name] ?? TAB_ICONS.index;
          const iconName = isFocused ? iconSet.focused : iconSet.default;

          if (isAdd) {
            return (
              <MotionPressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel="Add expense"
                onPress={() => router.push('/add-transaction' as never)}
                style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.65 : 1 }]}
              >
                <View style={[styles.addIcon, { backgroundColor: theme.primaryDark }]}>
                  <Ionicons name="add" size={25} color={theme.white} />
                </View>
                <ThemedText style={[styles.label, { color: theme.primary }]}>Add</ThemedText>
              </MotionPressable>
            );
          }

          return (
            <MotionPressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              aria-selected={isFocused}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.65 : 1 }]}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name={iconName}
                  size={23}
                  color={isFocused ? theme.primary : theme.textTertiary}
                />
              </View>
              <ThemedText
                style={[styles.label, { color: isFocused ? theme.primary : theme.textTertiary }]}
              >
                {label}
              </ThemedText>
            </MotionPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { flexDirection: 'row', width: '100%', maxWidth: 640, paddingHorizontal: 12, gap: 4 },
  container: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 56,
    paddingVertical: 4,
    minWidth: 0,
    borderRadius: 18,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
    fontWeight: '600',
  },
  iconSlot: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
