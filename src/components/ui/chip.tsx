import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-selected={selected}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primaryLight : theme.border,
          borderColor: selected ? theme.primaryLight : theme.border,
        },
        style,
      ]}
    >
      <ThemedText style={[styles.label, { color: selected ? theme.primary : theme.textSecondary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
