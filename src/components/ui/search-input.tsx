import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}: SearchInputProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.border, borderColor: theme.border },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={18} color={theme.textTertiary} style={styles.icon} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        style={[styles.input, { color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    paddingVertical: 12,
    outlineWidth: 0,
  },
});
