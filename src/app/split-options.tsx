import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Copy, ErrorText, Page, Panel, layout } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
import {
  equalSplit,
  money,
  parseMoney,
  percentageSplit,
  scale,
  type Draft,
  type Group,
  type Split,
} from '@/domain/ledger';
export default function SplitScreen() {
  const l = useLedger();
  const g = l.groups.find((g) => g.id === l.draft?.groupId);
  if (!l.draft || !g)
    return (
      <Page title="Change split">
        <Copy>Open an expense and enter an amount to change its split.</Copy>
      </Page>
    );
  try {
    parseMoney(l.draft.amount, g.currency);
  } catch {
    return (
      <Page title="Change split">
        <Copy>Enter an expense amount before changing the split.</Copy>
      </Page>
    );
  }
  return <SplitForm key={l.draft.id} draft={l.draft} group={g} />;
}
function SplitForm({ draft, group }: { draft: Draft; group: Group }) {
  const l = useLedger();
  const r = useRouter();
  const total = parseMoney(draft.amount, group.currency);
  const [method, setMethod] = useState(draft.method);
  const members = draft.participants;
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      (draft.splits.length ? draft.splits : equalSplit(total, members)).map((s) => [
        s.memberId,
        String(s.amount / scale(group.currency)),
      ]),
    ),
  );
  const [error, setError] = useState('');
  let splits: Split[] = [];
  let problem = '';
  try {
    if (!members.length) throw new Error('Select at least one person in the expense.');
    if (method === 'equal') splits = equalSplit(total, members);
    else if (method === 'percentage')
      splits = percentageSplit(
        total,
        members,
        members.map((m) => values[m] ?? ''),
      );
    else {
      splits = members.map((memberId) => ({
        memberId,
        amount:
          Number(values[memberId]) === 0 && /^0(\.0{1,2})?$/.test(values[memberId])
            ? 0
            : parseMoney(values[memberId] ?? '', group.currency),
      }));
      const sum = splits.reduce((n, s) => n + s.amount, 0);
      if (sum !== total)
        throw new Error(
          `${money(Math.abs(total - sum), group.currency)} ${sum < total ? 'remaining' : 'over the total'}.`,
        );
    }
  } catch (e) {
    problem = e instanceof Error ? e.message : 'Check your shares.';
  }
  return (
    <Page
      title="Change split"
      footer={
        <>
          <ErrorText message={error || problem} />
          <Button
            title="Apply split"
            disabled={!!problem}
            loading={l.busy}
            onPress={async () => {
              try {
                await l.saveDraft({ ...draft, method, splits });
                r.back();
              } catch (e) {
                setError(String(e));
              }
            }}
          />
        </>
      }
    >
      <Panel>
        <Copy>Expense total</Copy>
        <Copy>
          {money(total, group.currency)} · {members.length} people
        </Copy>
      </Panel>
      <View style={layout.wrap}>
        {(['equal', 'amount', 'percentage'] as const).map((m) => (
          <Chip
            key={m}
            label={m === 'equal' ? 'Equally' : m === 'amount' ? 'Amounts' : 'Percentages'}
            selected={method === m}
            onPress={() => {
              setMethod(m);
              setValues(
                Object.fromEntries(
                  equalSplit(m === 'percentage' ? 10000 : total, members).map((s) => [
                    s.memberId,
                    String(s.amount / (m === 'percentage' ? 100 : scale(group.currency))),
                  ]),
                ),
              );
            }}
          />
        ))}
      </View>
      {members.map((memberId) => (
        <Panel key={memberId}>
          <Copy>{group.members.find((m) => m.id === memberId)?.name}</Copy>
          {method === 'equal' ? (
            <Copy>
              {money(splits.find((s) => s.memberId === memberId)?.amount ?? 0, group.currency)}
            </Copy>
          ) : (
            <Input
              label={`${group.members.find((m) => m.id === memberId)?.name} ${method === 'percentage' ? 'percentage' : 'amount'}`}
              value={values[memberId] ?? ''}
              onChangeText={(v) => setValues({ ...values, [memberId]: v })}
              keyboardType="decimal-pad"
            />
          )}
        </Panel>
      ))}
      <Copy muted>
        Small rounding differences are assigned in whole{' '}
        {group.currency === 'JPY' ? 'yen' : 'minor units'} so the shares always match the total.
      </Copy>
    </Page>
  );
}
