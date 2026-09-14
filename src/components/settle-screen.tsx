import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { AccountButton, Copy, Heading, Page, Panel, Row, layout } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
import { debts, memberName, money, selfId } from '@/domain/ledger';
export function SettleScreen({
  groupId,
  currency,
  tab = false,
}: {
  groupId?: string;
  currency?: string;
  tab?: boolean;
}) {
  const l = useLedger();
  const r = useRouter();
  const [filter, setFilter] = useState('All');
  const groups = l.groups.filter(
    (g) => (!groupId || g.id === groupId) && (!currency || g.currency === currency),
  );
  const entries = groups.flatMap((g) =>
    debts(g)
      .filter((d) => d.from === selfId(g, l.userId) || d.to === selfId(g, l.userId))
      .map((d) => ({ g, d })),
  );
  const filtered = entries.filter(
    ({ g, d }) =>
      filter === 'All' ||
      (filter === 'You owe' ? d.from === selfId(g, l.userId) : d.to === selfId(g, l.userId)),
  );
  return (
    <Page title="Settle up" tab={tab} action={tab ? <AccountButton /> : undefined} refresh>
      <Heading>Who owes whom</Heading>
      <Copy muted>
        Record payments you’ve already made or received. Splitly does not move money.
      </Copy>
      <View style={layout.wrap}>
        {['All', 'You owe', 'You’re owed'].map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      {filtered.map(({ g, d }) => (
        <Row
          key={`${g.id}:${d.from}:${d.to}`}
          title={
            d.from === selfId(g, l.userId)
              ? `You owe ${memberName(g, d.to)}`
              : `${memberName(g, d.from)} owes you`
          }
          subtitle={`${money(d.amount, g.currency)} · ${g.name}`}
          onPress={() =>
            r.push({
              pathname: '/payment-method',
              params: { groupId: g.id, from: d.from, to: d.to },
            })
          }
        />
      ))}
      {!filtered.length && (
        <Panel>
          <Heading>{entries.length ? 'Nothing here' : 'You’re all settled up'}</Heading>
          <Copy>
            {entries.length
              ? 'No balances match this filter.'
              : 'You have no outstanding debts in these groups.'}
          </Copy>
        </Panel>
      )}
      <Copy muted>
        Each person and group is settled separately. Opposite balances with different people don’t
        cancel out.
      </Copy>
    </Page>
  );
}
