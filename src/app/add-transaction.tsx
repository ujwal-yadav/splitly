import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Confirm, Copy, ErrorText, Page, Panel, layout } from '@/components/ui/ledger-ui';
import { event, useLedger } from '@/contexts/ledger-context';
import {
  equalSplit,
  makeDraft,
  memberName,
  money,
  parseMoney,
  scale,
  validateExpense,
  type Draft,
  type Expense,
} from '@/domain/ledger';
export default function AddExpense() {
  const l = useLedger();
  const p = useLocalSearchParams<{ groupId?: string; expenseId?: string }>();
  if (l.loading || l.error) return <Page title="Add expense">{null}</Page>;
  const resume = !p.groupId && !p.expenseId;
  const resolvedGroup = p.groupId ?? (resume ? l.draft?.groupId : undefined);
  const resolvedExpense = p.expenseId ?? (resume ? l.draft?.expenseId : undefined);
  if (
    resolvedExpense &&
    !l.groups.some(
      (g) =>
        g.id === resolvedGroup && g.expenses.some((e) => e.id === resolvedExpense && !e.deleted),
    )
  )
    return (
      <Page title="Edit expense">
        <Copy>This expense is unavailable. Reopen it from Activity or its group.</Copy>
      </Page>
    );
  return (
    <ExpenseForm
      key={`${resolvedGroup ?? ''}:${resolvedExpense ?? ''}`}
      groupId={resolvedGroup}
      expenseId={resolvedExpense}
      resume={resume}
    />
  );
}
function ExpenseForm({
  groupId,
  expenseId,
  resume,
}: {
  groupId?: string;
  expenseId?: string;
  resume: boolean;
}) {
  const l = useLedger();
  const r = useRouter();
  const initialGroup = l.groups.find((g) => g.id === groupId);
  const original = initialGroup?.expenses.find((e) => e.id === expenseId);
  const originalVersion = useRef(
    resume && l.draft?.baseUpdatedAt ? l.draft.baseUpdatedAt : original?.updatedAt,
  );
  const navigation = useNavigation();
  const canLeave = useRef(false);
  const [pendingLeave, setPendingLeave] = useState<NavigationAction | null>(null);
  const [draft, setDraft] = useState<Draft>(() =>
    resume && l.draft
      ? l.draft
      : original
        ? {
            id: original.id,
            expenseId: original.id,
            baseUpdatedAt: original.updatedAt,
            groupId: initialGroup!.id,
            title: original.title,
            amount: String(original.amount / scale(initialGroup!.currency)),
            paidBy: original.paidBy,
            participants: original.splits.map((s) => s.memberId),
            method: original.method,
            splits: original.splits,
            date: original.date,
            note: original.note,
            receipt: original.receipt,
          }
        : l.draft && (!groupId || l.draft.groupId === groupId) && !l.draft.expenseId
          ? l.draft
          : makeDraft(initialGroup, l.userId),
  );
  const [initialDraft] = useState(() => JSON.stringify(draft));
  const dirty = JSON.stringify(draft) !== initialDraft;
  usePreventRemove(dirty, ({ data }) => {
    if (canLeave.current) navigation.dispatch(data.action);
    else setPendingLeave(data.action);
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const [details, setDetails] = useState(false);
  const [payerOpen, setPayerOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(!draft.groupId);
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const group = l.groups.find((g) => g.id === draft.groupId);
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const lastAppliedDraft = useRef(JSON.stringify(l.draft));
  useFocusEffect(
    useCallback(() => {
      if (l.draft?.id === draft.id && JSON.stringify(l.draft) !== lastAppliedDraft.current) {
        setDraft(l.draft);
        lastAppliedDraft.current = JSON.stringify(l.draft);
      }
    }, [l.draft, draft.id]),
  );
  let amount = 0;
  try {
    amount = parseMoney(draft.amount, group?.currency ?? l.preferences.currency);
  } catch {}
  const splits = draft.method === 'equal' ? equalSplit(amount, draft.participants) : draft.splits;
  const saveDraft = async () => {
    try {
      await l.saveDraft(draft);
      canLeave.current = true;
      if (r.canGoBack()) r.back();
      else r.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save draft.');
    }
  };
  const changeSplit = async () => {
    if (!group || !amount) {
      setError('Choose a group and enter an amount first.');
      return;
    }
    try {
      await l.saveDraft({ ...draft, splits });
      r.push('/split-options');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open split.');
    }
  };
  const save = async () => {
    setError('');
    if (!group) {
      setError('Choose a group.');
      return;
    }
    try {
      const total = parseMoney(draft.amount, group.currency);
      const now = new Date().toISOString();
      const expense: Expense = {
        id: draft.expenseId ?? draft.id,
        title: draft.title.trim(),
        amount: total,
        paidBy: draft.paidBy,
        splits: draft.method === 'equal' ? equalSplit(total, draft.participants) : draft.splits,
        method: draft.method,
        date: draft.date,
        note: draft.note.trim(),
        receipt: draft.receipt,
        createdAt: original?.createdAt ?? now,
        updatedAt: now,
      };
      validateExpense(group, expense);
      const existing = group.expenses.find((e) => e.id === expense.id);
      if (existing && !draft.expenseId) {
        canLeave.current = true;
        r.replace({
          pathname: '/transaction/[id]',
          params: { id: existing.id, groupId: group.id },
        });
        return;
      }
      if (draft.expenseId && (!existing || existing.updatedAt !== originalVersion.current))
        throw new Error('This expense changed. Reopen it before editing.');
      await l.saveGroup({
        ...group,
        expenses: existing
          ? group.expenses.map((e) => (e.id === expense.id ? expense : e))
          : [expense, ...group.expenses],
        events: [
          event(
            'expense',
            existing ? 'Expense updated' : 'Expense added',
            `${expense.title} · ${money(expense.amount, group.currency)} · Paid by ${memberName(group, expense.paidBy)}`,
            expense.id,
          ),
          ...group.events,
        ],
      });
      // The expense is already durable; draft cleanup is best-effort and never reports a false save failure.
      try {
        await l.saveDraft(null);
      } catch {}
      canLeave.current = true;
      r.replace({ pathname: '/transaction/[id]', params: { id: expense.id, groupId: group.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Your draft is still here.');
    }
  };
  return (
    <Page
      title={expenseId ? 'Edit expense' : 'Add expense'}
      footer={
        <>
          <ErrorText message={error} />
          <Button
            title={expenseId ? 'Save changes' : 'Add expense'}
            onPress={save}
            loading={l.busy}
            disabled={!group || group.archived}
          />
          <Button
            title="Save draft & close"
            variant="ghost"
            onPress={saveDraft}
            disabled={l.busy}
          />
        </>
      }
    >
      <Input
        label={`Amount (${group?.currency ?? l.preferences.currency})`}
        placeholder="0"
        keyboardType="decimal-pad"
        value={draft.amount}
        onChangeText={(v) => update({ amount: v, method: 'equal', splits: [] })}
        style={{ fontSize: 36, fontWeight: '700' }}
      />
      <Input
        label="Description"
        placeholder="e.g. Dinner"
        value={draft.title}
        onChangeText={(v) => update({ title: v })}
        maxLength={120}
      />
      <Button
        title={`With · ${group?.name ?? 'Choose group'}`}
        variant="outline"
        onPress={() => setGroupOpen(!groupOpen)}
        disabled={!!expenseId}
      />
      {groupOpen && (
        <Panel>
          {l.groups
            .filter((g) => !g.archived)
            .map((g) => (
              <Button
                key={g.id}
                title={g.name}
                variant="secondary"
                onPress={() => {
                  update({
                    groupId: g.id,
                    participants: g.members.map((m) => m.id),
                    paidBy: g.members.find((m) => m.userId === l.userId)?.id ?? g.members[0].id,
                    method: 'equal',
                    splits: [],
                  });
                  setGroupOpen(false);
                }}
              />
            ))}
          <Button title="Create a group" variant="ghost" onPress={() => r.push('/create-group')} />
        </Panel>
      )}
      {group && (
        <Panel>
          <Button
            title={`Paid by ${memberName(group, draft.paidBy)}`}
            variant="ghost"
            onPress={() => setPayerOpen(!payerOpen)}
          />
          {payerOpen && (
            <View style={layout.wrap}>
              {group.members.map((m) => (
                <Chip
                  key={m.id}
                  label={m.name}
                  selected={draft.paidBy === m.id}
                  onPress={() => {
                    update({ paidBy: m.id });
                    setPayerOpen(false);
                  }}
                />
              ))}
            </View>
          )}
          <Copy>Who shared this expense?</Copy>
          <View style={layout.wrap}>
            {group.members.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                selected={draft.participants.includes(m.id)}
                onPress={() =>
                  update({
                    participants: draft.participants.includes(m.id)
                      ? draft.participants.filter((p) => p !== m.id)
                      : [...draft.participants, m.id],
                    method: 'equal',
                    splits: [],
                  })
                }
              />
            ))}
          </View>
          <Copy muted>
            {draft.participants.length} people ·{' '}
            {draft.method === 'equal'
              ? 'Split equally'
              : draft.method === 'amount'
                ? 'Exact amounts'
                : 'Percentages'}{' '}
            · {draft.date}
          </Copy>
          {amount > 0 &&
            splits.map((s) => (
              <View key={s.memberId} style={[layout.row, { justifyContent: 'space-between' }]}>
                <Copy>{memberName(group, s.memberId)}</Copy>
                <Copy>{money(s.amount, group.currency)}</Copy>
              </View>
            ))}
          <Button title="Change split" variant="outline" onPress={changeSplit} />
        </Panel>
      )}
      <Button
        title={details ? 'Hide optional details' : 'Optional details · Date, note, receipt'}
        variant="ghost"
        onPress={() => setDetails(!details)}
      />
      {details && (
        <Panel>
          <Input
            label="Date (YYYY-MM-DD)"
            value={draft.date}
            onChangeText={(v) => update({ date: v })}
          />
          <Input
            label="Note (optional)"
            value={draft.note}
            onChangeText={(v) => update({ note: v })}
            multiline
            maxLength={1000}
          />
          <Button
            title={draft.receipt ? 'Change receipt' : 'Attach receipt'}
            variant="outline"
            onPress={async () => {
              try {
                await l.saveDraft(draft);
                r.push('/scan-bill');
              } catch (e) {
                setError(String(e));
              }
            }}
          />
          {draft.receipt && (
            <>
              <Image
                source={{ uri: draft.receipt }}
                style={{ width: '100%', height: 220 }}
                resizeMode="contain"
              />
              <Button
                title="Remove receipt"
                variant="ghost"
                onPress={() => update({ receipt: undefined })}
              />
            </>
          )}
        </Panel>
      )}
      {!expenseId && (
        <Button title="Discard draft" variant="ghost" onPress={() => setDiscard(true)} />
      )}
      <Confirm
        visible={discard}
        title="Discard this draft?"
        confirmLabel="Discard draft"
        onCancel={() => setDiscard(false)}
        onConfirm={async () => {
          try {
            await l.saveDraft(null);
            canLeave.current = true;
            r.replace('/(tabs)');
          } catch (e) {
            setError(String(e));
            setDiscard(false);
          }
        }}
      >
        <Copy>This draft has not been added to your balances.</Copy>
      </Confirm>
      <Confirm
        visible={!!pendingLeave}
        title="Keep this expense draft?"
        confirmLabel="Save draft & leave"
        busy={l.busy}
        onCancel={() => setPendingLeave(null)}
        onConfirm={async () => {
          try {
            await l.saveDraft(draft);
            canLeave.current = true;
            if (pendingLeave) navigation.dispatch(pendingLeave);
          } catch (e) {
            setError(String(e));
            setPendingLeave(null);
          }
        }}
      >
        <Copy>Your changes haven’t been added to the group yet.</Copy>
        <Button
          title="Discard changes & leave"
          variant="outline"
          disabled={l.busy}
          onPress={() => {
            canLeave.current = true;
            if (pendingLeave) navigation.dispatch(pendingLeave);
          }}
        />
      </Confirm>
    </Page>
  );
}
