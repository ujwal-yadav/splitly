import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Screen, ScreenHeader, ScreenIntro } from '@/components/ui/screen';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ThemedText } from '@/components/themed-text';
import { SearchInput } from '@/components/ui/search-input';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useLedger } from '@/contexts/ledger-context';
import { useToast } from '@/contexts/toast-context';
import type { Currency as CurrencyCode } from '@/domain/ledger';
import { useTheme } from '@/hooks/use-theme';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
];

export default function CurrencySelectorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const l = useLedger();
  const { showToast } = useToast();
  const [choice, setSelected] = useState<string | null>(null);
  const selected = choice ?? l.preferences.currency;
  const [search, setSearch] = useState('');

  const filtered = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Screen style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Currency" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenIntro
          eyebrow="AROUND THE WORLD"
          title="Pick your currency."
          description="Default for new groups only. Existing amounts stay in their original currency; no conversion is applied."
        />
        <View style={{ marginBottom: 20 }}>
          <SearchInput placeholder="Search currency" value={search} onChangeText={setSearch} />
        </View>

        {filtered.length === 0 && (
          <EmptyState
            icon="search-outline"
            title="No currencies found"
            subtitle="Try a currency name or code, such as INR."
          />
        )}
        {filtered.map((currency) => {
          const isSelected = currency.code === selected;
          return (
            <Pressable
              key={currency.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              aria-checked={isSelected}
              style={[
                styles.row,
                {
                  borderColor: isSelected ? theme.primary : theme.border,
                  backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                },
              ]}
              onPress={() => setSelected(currency.code)}
            >
              <View style={styles.flagCircle}>
                <ThemedText style={styles.flag}>{currency.flag}</ThemedText>
              </View>
              <View style={styles.rowCenter}>
                <ThemedText style={[styles.currencyName, { color: theme.text }]}>
                  {currency.name}
                </ThemedText>
                <ThemedText style={[styles.currencyCode, { color: theme.textSecondary }]}>
                  {currency.code} ({currency.symbol})
                </ThemedText>
              </View>
              {isSelected && (
                <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ padding: 24 }}>
        <Button
          title={`Done · ${selected}`}
          loading={l.busy}
          onPress={async () => {
            try {
              await l.savePreferences({ ...l.preferences, currency: selected as CurrencyCode });
              router.back();
            } catch (e) {
              showToast(String(e), 'error');
            }
          }}
          size="lg"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  flagCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  flag: {
    fontSize: 22,
  },
  rowCenter: {
    flex: 1,
  },
  currencyName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: FontSize.xs,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
