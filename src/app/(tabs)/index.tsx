import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.logo, { color: theme.primary }]}>Splitly</ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText style={[styles.greeting, { color: theme.text }]}>
          Good morning, Ujwal 👋
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          You're all settled up!
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
});
