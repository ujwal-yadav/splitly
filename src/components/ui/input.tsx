import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      )}
      <View style={[styles.inputWrapper, { borderColor, backgroundColor: theme.surface }]}>
        {icon && <Ionicons name={icon} size={20} color={theme.textTertiary} style={styles.icon} />}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textTertiary}
          accessibilityLabel={props.accessibilityLabel ?? label ?? props.placeholder}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {rightIcon && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              rightIcon?.startsWith('eye') ? 'Toggle password visibility' : 'Input action'
            }
            onPress={onRightIconPress}
            hitSlop={8}
            style={{ minWidth: 32, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={rightIcon} size={20} color={theme.textTertiary} />
          </Pressable>
        )}
      </View>
      {error && <ThemedText style={[styles.error, { color: theme.danger }]}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.md,
    outlineWidth: 0,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
