import { MotionPressable } from '@/components/ui/motion-pressable';
import { StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const containerStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.primaryDark },
    secondary: { backgroundColor: theme.primaryLight },
    outline: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    ghost: { backgroundColor: 'transparent' },
  };

  const textStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: theme.white },
    secondary: { color: theme.primary },
    outline: { color: theme.text },
    ghost: { color: theme.primary },
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
    md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing['2xl'] },
  };

  const textSizes: Record<ButtonSize, number> = {
    sm: FontSize.sm,
    md: FontSize.base,
    lg: FontSize.base,
  };

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        containerStyles[variant],
        sizeStyles[size],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textStyles[variant].color} size="small" />
      ) : (
        <ThemedText style={[styles.text, textStyles[variant], { fontSize: textSizes[size] }]}>
          {title}
        </ThemedText>
      )}
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
