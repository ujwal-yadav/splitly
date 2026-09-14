import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { AccountButton, Copy, Page, Panel, Row, layout } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
export default function Activity() {
  const l = useLedger();
  const r = useRouter();
  const [filter, setFilter] = useState('All');
  const events = l.groups
    .flatMap((g) => g.events.map((e) => ({ g, e })))
    .filter(
      ({ e }) =>
        filter === 'All' || (filter === 'Expenses' ? e.type === 'expense' : e.type === 'payment'),
    )
    .sort((a, b) => b.e.at.localeCompare(a.e.at));
  return (
    <Page title="Activity" tab action={<AccountButton />} refresh>
      <View style={layout.wrap}>
        {['All', 'Expenses', 'Payments'].map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      {events.map(({ g, e }) => (
        <Row
          key={e.id}
          title={e.title}
          subtitle={`${e.detail}\n${g.name} · ${e.actorName ? e.actorName + ' · ' : ''}${new Date(e.at).toLocaleString()}`}
          onPress={() =>
            e.type === 'expense' && e.targetId
              ? r.push({ pathname: '/transaction/[id]', params: { id: e.targetId, groupId: g.id } })
              : e.type === 'payment' && e.targetId
                ? r.push({
                    pathname: '/payment-success',
                    params: { paymentId: e.targetId, groupId: g.id },
                  })
                : r.push({ pathname: '/group/[id]', params: { id: g.id } })
          }
        />
      ))}
      {!events.length && (
        <Panel>
          <Copy>No activity yet. Saved expenses and payments will appear here.</Copy>
        </Panel>
      )}
    </Page>
  );
}
