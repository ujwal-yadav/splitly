import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { BorderRadius, Spacing, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export function Card({ children, onPress, style, variant = 'elevated' }: CardProps) {
  const theme = useTheme();

  const variantStyles: Record<string, ViewStyle> = {
    elevated: { backgroundColor: theme.surface, ...Shadow.md },
    outlined: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    filled: { backgroundColor: theme.primaryLight },
  };

  const content = <View style={[styles.base, variantStyles[variant], style]}>{children}</View>;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  pressed: {
    opacity: 0.9,
  },
});
