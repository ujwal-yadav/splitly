import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontSize, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DividerProps {
  text: string;
}

export function Divider({ text }: DividerProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <ThemedText style={[styles.text, { color: theme.textTertiary }]}>{text}</ThemedText>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    fontSize: FontSize.sm,
    marginHorizontal: Spacing.lg,
  },
});
