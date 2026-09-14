import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Confirm, Copy, ErrorText, Heading, Page, Panel, layout } from '@/components/ui/ledger-ui';
import { event, useLedger } from '@/contexts/ledger-context';
import { memberName, money, selfId } from '@/domain/ledger';
export default function ExpenseDetail() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId?: string }>();
  const l = useLedger();
  const r = useRouter();
  const group = l.groups.find((g) =>
    groupId ? g.id === groupId : g.expenses.some((e) => e.id === id),
  );
  const expense = group?.expenses.find((e) => e.id === id);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  if (!group || !expense)
    return (
      <Page title="Expense">
        <Copy>This expense is unavailable.</Copy>
      </Page>
    );
  const me = selfId(group, l.userId);
  const share = expense.splits.find((s) => s.memberId === me)?.amount ?? 0;
  const toggleDelete = async () => {
    try {
      await l.saveGroup({
        ...group,
        expenses: group.expenses.map((e) =>
          e.id === id ? { ...e, deleted: !e.deleted, updatedAt: new Date().toISOString() } : e,
        ),
        events: [
          event(
            'expense',
            expense.deleted ? 'Expense restored' : 'Expense deleted',
            expense.title,
            id,
          ),
          ...group.events,
        ],
      });
      setConfirm(false);
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <Page title="Expense details">
      <Panel>
        <Copy muted>
          {group.name} · {expense.date}
        </Copy>
        <Heading>{expense.title}</Heading>
        <Heading>{money(expense.amount, group.currency)}</Heading>
        <Copy>{memberName(group, expense.paidBy)} paid</Copy>
        <Copy>
          {expense.deleted
            ? 'Deleted · Excluded from balances'
            : `Your share ${money(share, group.currency)}`}
        </Copy>
      </Panel>
      <Heading>Who shares this expense</Heading>
      <Panel>
        {expense.splits.map((s) => (
          <View key={s.memberId} style={[layout.row, { justifyContent: 'space-between' }]}>
            <Copy>{memberName(group, s.memberId)}</Copy>
            <Copy>{money(s.amount, group.currency)}</Copy>
          </View>
        ))}
      </Panel>
      <Copy muted>
        Current amounts still owed are in the group’s Balances tab, including recorded payments.
      </Copy>
      {!!expense.note && (
        <Panel>
          <Copy>{expense.note}</Copy>
        </Panel>
      )}
      {expense.receipt && (
        <Image
          source={{ uri: expense.receipt }}
          style={{ width: '100%', height: 320 }}
          resizeMode="contain"
          accessibilityLabel="Attached receipt"
        />
      )}
      {!expense.deleted && !group.archived && (
        <Button
          title="Edit expense"
          onPress={() =>
            r.push({
              pathname: '/add-transaction',
              params: { groupId: group.id, expenseId: expense.id },
            })
          }
        />
      )}
      {!group.archived && (
        <Button
          title={expense.deleted ? 'Restore expense' : 'Delete expense'}
          variant="outline"
          onPress={() => (expense.deleted ? void toggleDelete() : setConfirm(true))}
        />
      )}
      <Button
        title="View group balances"
        variant="secondary"
        onPress={() => r.push({ pathname: '/settle-up', params: { groupId: group.id } })}
      />
      <Heading>History</Heading>
      {group.events
        .filter((e) => e.targetId === id)
        .map((e) => (
          <Panel key={e.id}>
            <Copy>{e.title}</Copy>
            <Copy muted>
              {e.detail} · {e.actorName ? e.actorName + ' · ' : ''}
              {new Date(e.at).toLocaleString()}
            </Copy>
          </Panel>
        ))}
      <ErrorText message={error} />
      <Confirm
        visible={confirm}
        title="Delete this expense?"
        confirmLabel="Delete expense"
        busy={l.busy}
        onCancel={() => setConfirm(false)}
        onConfirm={toggleDelete}
      >
        <Copy>
          Balances will be recalculated. Recorded payments remain in the group. You can restore this
          expense from Activity.
        </Copy>
        <ErrorText message={error} />
      </Confirm>
    </Page>
  );
}
