import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={onToggle}
      style={styles.container}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? theme.primaryDark : 'transparent',
            borderColor: checked ? theme.primaryDark : theme.border,
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={14} color={theme.white} />}
      </View>
      <ThemedText style={[styles.label, { color: theme.text }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
});
