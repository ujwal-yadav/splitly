import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Confirm, Copy, ErrorText, Heading, Page, Panel } from '@/components/ui/ledger-ui';
import { event, useLedger } from '@/contexts/ledger-context';
import { debts, memberName, money } from '@/domain/ledger';
export default function PaymentRecord() {
  const { groupId, paymentId } = useLocalSearchParams<{ groupId: string; paymentId: string }>();
  const l = useLedger();
  const r = useRouter();
  const group = l.groups.find((g) => g.id === groupId);
  const payment = group?.payments.find((p) => p.id === paymentId);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  if (!group || !payment)
    return (
      <Page title="Payment record">
        <Copy>No saved payment matches this link.</Copy>
      </Page>
    );
  const balance = debts(group).find((d) => d.from === payment.from && d.to === payment.to);
  return (
    <Page title={payment.reversed ? 'Payment undone' : 'Payment recorded'}>
      <Panel>
        <Heading>{money(payment.amount, group.currency)}</Heading>
        <Copy>
          {memberName(group, payment.from)} → {memberName(group, payment.to)}
        </Copy>
        <Copy muted>
          {group.name} · {payment.method} · {new Date(payment.createdAt).toLocaleString()}
        </Copy>
        {!!payment.note && <Copy>{payment.note}</Copy>}
      </Panel>
      <Copy>
        {payment.reversed
          ? 'This record no longer affects balances.'
          : 'Saved to your group. This is a manual record, not a bank confirmation.'}
      </Copy>
      <Copy>Remaining in this direction: {money(balance?.amount ?? 0, group.currency)}</Copy>
      <Button
        title="Back to balances"
        onPress={() => r.replace({ pathname: '/settle-up', params: { groupId } })}
      />
      {!payment.reversed && (
        <Button title="Undo payment record" variant="outline" onPress={() => setConfirm(true)} />
      )}
      <ErrorText message={error} />
      <Confirm
        visible={confirm}
        title="Undo this record?"
        confirmLabel="Undo payment record"
        onCancel={() => setConfirm(false)}
        busy={l.busy}
        onConfirm={async () => {
          try {
            await l.saveGroup({
              ...group,
              payments: group.payments.map((p) =>
                p.id === paymentId ? { ...p, reversed: true } : p,
              ),
              events: [
                event(
                  'payment',
                  'Payment record undone',
                  money(payment.amount, group.currency),
                  payment.id,
                ),
                ...group.events,
              ],
            });
            setConfirm(false);
          } catch (e) {
            setError(String(e));
            setConfirm(false);
          }
        }}
      >
        <Copy>
          This changes the group’s balances. It does not refund or reverse a bank transfer.
        </Copy>
      </Confirm>
    </Page>
  );
}
