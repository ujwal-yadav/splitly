import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Confirm, Copy, ErrorText, Heading, Page, Panel, layout } from '@/components/ui/ledger-ui';
import { event, useLedger } from '@/contexts/ledger-context';
import {
  debts,
  id,
  memberName,
  money,
  parseMoney,
  scale,
  validatePayment,
  type Group,
} from '@/domain/ledger';
export default function PaymentScreen() {
  const l = useLedger();
  const p = useLocalSearchParams<{ groupId: string; from: string; to: string }>();
  const group = l.groups.find((g) => g.id === p.groupId);
  if (!group)
    return (
      <Page title="Record a payment">
        <Copy>Choose an outstanding balance from Settle up.</Copy>
      </Page>
    );
  return (
    <PaymentForm key={`${p.groupId}:${p.from}:${p.to}`} group={group} from={p.from} to={p.to} />
  );
}
function PaymentForm({ group, from, to }: { group: Group; from: string; to: string }) {
  const l = useLedger();
  const r = useRouter();
  const balance = debts(group).find((d) => d.from === from && d.to === to);
  const [amount, setAmount] = useState(String((balance?.amount ?? 0) / scale(group.currency)));
  const [method, setMethod] = useState(l.preferences.paymentMethod);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [paymentId] = useState(id);
  const payment = () => ({
    id: paymentId,
    from,
    to,
    amount: parseMoney(amount, group.currency),
    method,
    note: note.trim(),
    createdAt: new Date().toISOString(),
  });
  const save = async () => {
    try {
      if (group.payments.some((p) => p.id === paymentId)) {
        r.replace({ pathname: '/payment-success', params: { groupId: group.id, paymentId } });
        return;
      }
      const p = payment();
      validatePayment(group, p);
      await l.saveGroup({
        ...group,
        payments: [p, ...group.payments],
        events: [
          event(
            'payment',
            'Payment recorded',
            `${memberName(group, from)} → ${memberName(group, to)} · ${money(p.amount, group.currency)}`,
            p.id,
          ),
          ...group.events,
        ],
      });
      r.replace({ pathname: '/payment-success', params: { groupId: group.id, paymentId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the payment.');
      setConfirm(false);
    }
  };
  return (
    <Page
      title="Record a payment"
      footer={
        <>
          <ErrorText message={error} />
          <Button
            title="Review payment"
            disabled={!balance || l.busy}
            onPress={() => {
              try {
                validatePayment(group, payment());
                setError('');
                setConfirm(true);
              } catch (e) {
                setError(String(e));
              }
            }}
          />
        </>
      }
    >
      <Panel>
        <Copy muted>{group.name}</Copy>
        <Heading>
          {memberName(group, from)} → {memberName(group, to)}
        </Heading>
        <Copy>Outstanding: {money(balance?.amount ?? 0, group.currency)}</Copy>
      </Panel>
      <Input
        label={`Amount paid (${group.currency})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Copy muted>Partial payments are welcome. The remaining balance stays open.</Copy>
      <Copy>How was it paid?</Copy>
      <View style={layout.wrap}>
        {['Bank transfer', 'UPI', 'Cash', 'Other'].map((m) => (
          <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />
        ))}
      </View>
      <Input label="Note (optional)" value={note} onChangeText={setNote} maxLength={500} />
      <Copy>
        This records a payment made outside Splitly. It does not send money or verify receipt with a
        payment provider.
      </Copy>
      <Confirm
        visible={confirm}
        title="Record this payment?"
        confirmLabel="Payment already made · Record it"
        busy={l.busy}
        onCancel={() => setConfirm(false)}
        onConfirm={save}
      >
        <Copy>
          {memberName(group, from)} paid {memberName(group, to)} {amount} {group.currency} by{' '}
          {method}.
        </Copy>
        <Copy>You can undo the record if you made a mistake.</Copy>
      </Confirm>
    </Page>
  );
}
