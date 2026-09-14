import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Copy, Panel, layout } from '@/components/ui/ledger-ui';
import { Logo } from '@/components/ui/logo';
import { useTheme } from '@/hooks/use-theme';
export default function Intro() {
  const r = useRouter();
  const t = useTheme();
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[layout.content, { flexGrow: 1, justifyContent: 'center', gap: 16 }]}
      >
        <Logo size={48} />
        <ThemedText
          style={{ fontSize: 28, lineHeight: 32, letterSpacing: -1.5, fontWeight: '700' }}
        >
          {'Share the moment.\nSplit the expense.'}
        </ThemedText>
        <Copy muted>One place to see who paid, what you owe, and what’s settled.</Copy>
        <Panel>
          {[
            ['receipt-outline', 'Add an expense', 'Enter an amount and choose who shared it.'],
            ['people-outline', 'See clear balances', 'Know exactly who owes whom.'],
            [
              'checkmark-circle-outline',
              'Record a payment',
              'Keep track after paying outside Splitly.',
            ],
          ].map(([icon, title, description]) => (
            <View key={title} style={layout.row}>
              <Ionicons name={icon as 'receipt-outline'} size={24} color={t.primary} />
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>{title}</ThemedText>
                <Copy muted>{description}</Copy>
              </View>
            </View>
          ))}
        </Panel>
        <Button title="Create account" onPress={() => r.push('/(auth)/sign-up')} />
        <Copy muted>Sign in to keep your groups and balances synced across devices.</Copy>
        <Button title="Sign in" variant="outline" onPress={() => r.push('/(auth)/login')} />
      </ScrollView>
    </Screen>
  );
}
