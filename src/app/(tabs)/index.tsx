import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import {
  AccountButton,
  Copy,
  GroupRow,
  Heading,
  Page,
  Panel,
  Row,
} from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
import { money, totals, type Currency } from '@/domain/ledger';
export default function Home() {
  const l = useLedger();
  const r = useRouter();
  const amounts = totals(l.groups, l.userId);
  return (
    <Page title="Home" tab action={<AccountButton />} refresh>
      <Copy muted>Your shared expenses</Copy>
      {!l.groups.length ? (
        <Panel hero>
          <ThemedText style={{ color: 'white', fontSize: 26, fontWeight: '700' }}>
            {'Good times.\nClear balances.'}
          </ThemedText>
          <ThemedText style={{ color: '#D5E7DD', lineHeight: 20 }}>
            Start a group for your next dinner, trip, or everyday expenses.
          </ThemedText>
          <Button
            title="Create your first group"
            variant="secondary"
            onPress={() => r.push('/create-group')}
          />
        </Panel>
      ) : (
        <>
          {Object.entries(amounts).map(([code, b]) => (
            <Panel key={code} hero>
              <ThemedText style={{ color: '#D5E7DD', fontSize: 13 }}>{code} BALANCES</ThemedText>
              <ThemedText style={{ color: 'white', fontSize: 24, fontWeight: '700' }}>
                You owe {l.preferences.hideAmounts ? '••••' : money(b.owe, code as Currency)}
              </ThemedText>
              <ThemedText style={{ color: '#D5E7DD', fontSize: 18 }}>
                You’re owed {l.preferences.hideAmounts ? '••••' : money(b.owed, code as Currency)}
              </ThemedText>
              <Button
                title="See who owes whom"
                variant="secondary"
                onPress={() => r.push({ pathname: '/settle-up', params: { currency: code } })}
              />
            </Panel>
          ))}
          <Heading>Your groups</Heading>
          {l.groups
            .filter((g) => !g.archived)
            .slice(0, 3)
            .map((g) => (
              <GroupRow key={g.id} group={g} hideAmounts={l.preferences.hideAmounts} />
            ))}
        </>
      )}
      {l.draft && (
        <Row
          title="Continue your expense"
          subtitle={l.draft.title || 'You have a saved draft'}
          onPress={() => r.push('/add-transaction')}
        />
      )}
      <Row
        title="Join a group"
        subtitle="Have an invitation code?"
        onPress={() => r.push('/join-group')}
      />
    </Page>
  );
}
