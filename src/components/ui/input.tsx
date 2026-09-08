import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, icon, containerStyle, style, ...props }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      )}
      <View style={[styles.inputWrapper, { borderColor, backgroundColor: theme.surface }]}>
        {icon && (
          <Ionicons name={icon} size={20} color={theme.textTertiary} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && (
        <ThemedText style={[styles.error, { color: theme.danger }]}>{error}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing.md,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
