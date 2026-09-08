import { Pressable, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';

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
    primary: { backgroundColor: theme.primary },
    secondary: { backgroundColor: theme.primaryLight },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
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
    lg: FontSize.lg,
  };

  return (
    <Pressable
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
        <ThemedText
          style={[
            styles.text,
            textStyles[variant],
            { fontSize: textSizes[size] },
          ]}
        >
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
