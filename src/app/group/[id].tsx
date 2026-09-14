import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Share, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Copy, ErrorText, Page, Panel, Row, layout } from '@/components/ui/ledger-ui';
import { event, useLedger } from '@/contexts/ledger-context';
import { debts, id, memberName, money } from '@/domain/ledger';
import { supabase } from '@/lib/supabase';
export default function GroupScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const l = useLedger();
  const r = useRouter();
  const group = l.groups.find((g) => g.id === groupId);
  const [tab, setTab] = useState('Expenses');
  const [q, setQ] = useState('');
  const [person, setPerson] = useState('');
  const [email, setEmail] = useState('');
  const [addingByEmail, setAddingByEmail] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');
  const emailLock = useRef(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState('');
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState(false);
  if (!group)
    return (
      <Page title="Group">
        <Copy>This group is unavailable or you no longer have access.</Copy>
      </Page>
    );
  const outstanding = debts(group);
  const me = group.members.find((m) => m.userId === l.userId)?.id;
  const expenses = group.expenses.filter(
    (e) => !e.deleted && e.title.toLowerCase().includes(q.toLowerCase()),
  );
  const archive = async () => {
    try {
      if (!group.archived && outstanding.length)
        throw new Error('Record all outstanding payments before archiving this group.');
      await l.saveGroup({
        ...group,
        archived: !group.archived,
        events: [
          event('group', group.archived ? 'Group reopened' : 'Group archived', group.name),
          ...group.events,
        ],
      });
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <Page title={group.name} refresh>
      <Copy muted>
        {group.currency} · {group.members.length} people{group.archived ? ' · Archived' : ''}
      </Copy>
      <Panel hero>
        <View style={{ gap: 8 }}>
          {outstanding.filter((d) => d.from === me || d.to === me).length ? (
            outstanding
              .filter((d) => d.from === me || d.to === me)
              .map((d) => (
                <Button
                  key={`${d.from}:${d.to}`}
                  title={
                    d.from === me
                      ? `You owe ${memberName(group, d.to)} ${money(d.amount, group.currency)}`
                      : `${memberName(group, d.from)} owes you ${money(d.amount, group.currency)}`
                  }
                  variant="secondary"
                  onPress={() => r.push({ pathname: '/settle-up', params: { groupId } })}
                />
              ))
          ) : (
            <Button
              title="No outstanding balances for you"
              variant="secondary"
              onPress={() => setTab('Balances')}
            />
          )}
        </View>
      </Panel>
      {!group.archived && (
        <Button
          title="Add expense"
          onPress={() => r.push({ pathname: '/add-transaction', params: { groupId } })}
        />
      )}
      <View style={layout.wrap}>
        {['Expenses', 'Balances', 'People'].map((t) => (
          <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>
      {tab === 'Expenses' && (
        <>
          <SearchInput value={q} onChangeText={setQ} placeholder="Search expenses" />
          {expenses.map((e) => (
            <Row
              key={e.id}
              title={`${e.title} · ${money(e.amount, group.currency)}`}
              subtitle={`${memberName(group, e.paidBy)} paid · ${e.date}\nYour share ${money(e.splits.find((s) => s.memberId === me)?.amount ?? 0, group.currency)}`}
              onPress={() =>
                r.push({ pathname: '/transaction/[id]', params: { id: e.id, groupId } })
              }
            />
          ))}
          {!expenses.length && (
            <Panel>
              <Copy>
                {q
                  ? 'No matching expenses.'
                  : 'Add your first shared expense. The balances will appear here.'}
              </Copy>
            </Panel>
          )}
        </>
      )}
      {tab === 'Balances' && (
        <>
          {outstanding.map((d) => (
            <Row
              key={`${d.from}:${d.to}`}
              title={`${memberName(group, d.from)} owes ${memberName(group, d.to)}`}
              subtitle={money(d.amount, group.currency)}
              onPress={() =>
                r.push({ pathname: '/payment-method', params: { groupId, from: d.from, to: d.to } })
              }
            />
          ))}
          {!outstanding.length && (
            <Panel>
              <Copy>
                {group.expenses.some((expense) => !expense.deleted)
                  ? 'Everyone is settled up.'
                  : 'Add your first shared expense. The balances will appear here.'}
              </Copy>
            </Panel>
          )}
          <Copy muted>
            Balances offset payments between the same two people in this group. No debts are moved
            to other people or groups.
          </Copy>
        </>
      )}
      {tab === 'People' && (
        <>
          {group.members.map((m) => (
            <Panel key={m.id}>
              <Copy>
                {m.name}
                {m.userId === l.userId ? ' (you)' : ''}
              </Copy>
              <Copy muted>{m.userId ? 'Joined' : 'Added by name · Has not joined'}</Copy>
              {!m.userId && group.owner === l.userId && (
                <Button
                  title={`Invite ${m.name}`}
                  variant="outline"
                  onPress={async () => {
                    try {
                      const { data, error } = await supabase.rpc('create_ledger_invite', {
                        p_group: group.id,
                        p_member: m.id,
                      });
                      if (error) throw error;
                      setInvite(data);
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                />
              )}
            </Panel>
          ))}
          {group.owner === l.userId && !group.archived && (
            <Panel>
              <Input
                label="Member email"
                placeholder="name@example.com"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setMemberMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={254}
              />
              <Copy muted>
                Add a registered user to this group. They’ll be able to see its expenses and
                balances.
              </Copy>
              <Button
                title="Add by email"
                loading={addingByEmail}
                disabled={!email.trim() || l.busy}
                onPress={async () => {
                  if (emailLock.current) return;
                  setError('');
                  setMemberMessage('');
                  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
                    setError('Enter a valid email address.');
                    return;
                  }
                  emailLock.current = true;
                  setAddingByEmail(true);
                  try {
                    const { data, error } = await supabase.rpc('add_ledger_member_by_email', {
                      p_group: group.id,
                      p_email: email.trim(),
                      p_revision: group.revision,
                    });
                    if (error) throw error;
                    setMemberMessage(
                      data.already_member
                        ? `${data.name} is already in this group.`
                        : `${data.name} was added to the group.`,
                    );
                    setEmail('');
                    await l.refresh();
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : String((e as { message?: string }).message ?? e),
                    );
                  } finally {
                    emailLock.current = false;
                    setAddingByEmail(false);
                  }
                }}
              />
              {!!memberMessage && <Copy>{memberMessage}</Copy>}
            </Panel>
          )}
          {group.owner === l.userId && (
            <Panel>
              <Input label="Add a person" value={person} onChangeText={setPerson} maxLength={60} />
              <Button
                title="Add person"
                variant="secondary"
                disabled={!person.trim() || l.busy}
                onPress={async () => {
                  try {
                    if (
                      group.members.some(
                        (m) => m.name.toLowerCase() === person.trim().toLowerCase(),
                      )
                    )
                      throw new Error('That name is already in this group.');
                    await l.saveGroup({
                      ...group,
                      members: [...group.members, { id: id(), name: person.trim() }],
                      events: [event('group', 'Person added', person.trim()), ...group.events],
                    });
                    setPerson('');
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              />
            </Panel>
          )}
          {invite && (
            <Panel>
              <Copy>Invitation code (expires in 7 days)</Copy>
              <Copy>{invite}</Copy>
              <Copy muted>
                This code lets its recipient join as the person you selected. Share it only with
                them.
              </Copy>
              <Button
                title="Share invitation"
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Join ${group.name} on Splitly. Choose “Join a group” and enter this code: ${invite}`,
                    });
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              />
            </Panel>
          )}
          <Button
            title="Share balance summary"
            variant="outline"
            onPress={async () => {
              try {
                await Share.share({
                  message: `${group.name} · ${group.currency}\n${outstanding.map((d) => `${memberName(group, d.from)} owes ${memberName(group, d.to)} ${money(d.amount, group.currency)}`).join('\n') || 'Everyone is settled up.'}\nSummary only · ${new Date().toLocaleDateString()}`,
                });
              } catch (e) {
                setError(String(e));
              }
            }}
          />
          {group.owner === l.userId && (
            <>
              <Button
                title="Rename group"
                variant="ghost"
                onPress={() => {
                  setName(group.name);
                  setRenaming(!renaming);
                }}
              />
              {renaming && (
                <Panel>
                  <Input label="Group name" value={name} onChangeText={setName} maxLength={80} />
                  <Button
                    title="Save name"
                    disabled={!name.trim() || l.busy}
                    onPress={async () => {
                      try {
                        await l.saveGroup({
                          ...group,
                          name: name.trim(),
                          events: [
                            event('group', 'Group renamed', `${group.name} → ${name.trim()}`),
                            ...group.events,
                          ],
                        });
                        setRenaming(false);
                      } catch (e) {
                        setError(String(e));
                      }
                    }}
                  />
                </Panel>
              )}
              <Button
                title={group.archived ? 'Reopen group' : 'Archive group'}
                variant="ghost"
                onPress={archive}
              />
            </>
          )}
        </>
      )}
      <ErrorText message={error} />
    </Page>
  );
}
