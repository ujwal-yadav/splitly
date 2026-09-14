import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Provider = 'google' | 'apple';

interface SocialButtonProps {
  provider: Provider;
  label?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const PROVIDER_CONFIG: Record<Provider, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  google: { icon: 'logo-google', label: 'Continue with Google' },
  apple: { icon: 'logo-apple', label: 'Continue with Apple' },
};

export function SocialButton({ provider, label, onPress, style }: SocialButtonProps) {
  const theme = useTheme();
  const config = PROVIDER_CONFIG[provider];
  const displayLabel = label ?? config.label;
  const isCompact = !label && label !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={config.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderColor: theme.border, backgroundColor: theme.surface },
        isCompact ? styles.compact : styles.full,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isCompact ? 22 : 18}
        color={theme.text}
        style={!isCompact && styles.icon}
      />
      {!isCompact && (
        <ThemedText style={[styles.label, { color: theme.text }]}>{displayLabel}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    minHeight: 54,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  full: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  compact: {
    height: 56,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
