import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_ICONS: Record<string, { default: keyof typeof Ionicons.glyphMap; focused: keyof typeof Ionicons.glyphMap }> = {
  index: { default: 'home-outline', focused: 'home' },
  groups: { default: 'people-outline', focused: 'people' },
  add: { default: 'add', focused: 'add' },
  activity: { default: 'time-outline', focused: 'time' },
  profile: { default: 'person-outline', focused: 'person' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || Spacing.sm, backgroundColor: theme.background, borderTopColor: theme.border }]}>
      {state.routes.map((route, index) => {
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
            <Pressable key={route.key} onPress={onPress} style={styles.addButtonWrapper}>
              <View style={[styles.addButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="add" size={28} color={theme.white} />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? theme.primary : theme.textTertiary}
            />
            <ThemedText
              style={[
                styles.label,
                { color: isFocused ? theme.primary : theme.textTertiary },
              ]}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  addButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...Shadow.lg,
  },
});
