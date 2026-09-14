import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { Copy, ErrorText, Page, Panel, layout } from '@/components/ui/ledger-ui';
import { event, useLedger } from '@/contexts/ledger-context';
import { CURRENCIES, id, type Currency, type Group, type Member } from '@/domain/ledger';
export default function CreateGroup() {
  const l = useLedger();
  const r = useRouter();
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [error, setError] = useState('');
  const [groupId] = useState(id);
  const [custom, setCustom] = useState(false);
  const add = () => {
    if (!person.trim()) return;
    if (!person.includes('@') && person.trim().length > 60) {
      setError('Keep names to 60 characters or fewer.');
      return;
    }
    if (person.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (members.some((m) => m.name.toLowerCase() === person.trim().toLowerCase())) {
      setError('Use distinct names so you can tell people apart.');
      return;
    }
    setMembers([...members, { id: id(), name: person.trim() }]);
    setPerson('');
    setError('');
  };
  const save = async () => {
    setError('');
    if (!name.trim()) {
      setError('Give your group a name.');
      return;
    }
    if (person.trim()) {
      setError('Add the person you typed, or clear the name before continuing.');
      return;
    }
    const group: Group = {
      id: groupId,
      name: name.trim(),
      currency: currency ?? l.preferences.currency,
      members: [
        { id: l.userId, name: l.preferences.name, userId: l.userId },
        ...members.filter((m) => !m.name.includes('@')),
      ],
      expenses: [],
      payments: [],
      events: [event('group', 'Group created', name.trim())],
      revision: 0,
      archived: false,
      owner: l.userId,
    };
    try {
      await l.saveGroup(
        group,
        members.filter((m) => m.name.includes('@')).map((m) => m.name),
      );
      r.replace({ pathname: '/group/[id]', params: { id: group.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create group. Try again.');
    }
  };
  return (
    <Page
      title="Create group"
      footer={
        <>
          <ErrorText message={error} />
          <Button title="Create group" loading={l.busy} onPress={save} />
        </>
      }
    >
      <Input
        label="Group name"
        placeholder="e.g. Weekend crew"
        value={name}
        onChangeText={setName}
        maxLength={80}
      />
      <Panel>
        <Copy>
          Add an existing account by email to share this group automatically. People added by name
          can join later with an invitation.
        </Copy>
        <Input
          label="Name or email (optional)"
          value={person}
          onChangeText={setPerson}
          placeholder="e.g. Priya or priya@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={254}
          onSubmitEditing={add}
        />
        <Button title="Add person" variant="secondary" onPress={add} />
        <Copy muted>You’re included automatically.</Copy>
        <View style={layout.wrap}>
          {members.map((m) => (
            <Chip
              key={m.id}
              label={`${m.name} ×`}
              selected
              onPress={() => setMembers(members.filter((x) => x.id !== m.id))}
            />
          ))}
        </View>
      </Panel>
      <Button
        title={`Currency · ${currency ?? l.preferences.currency}`}
        variant="outline"
        onPress={() => setCustom(!custom)}
      />
      {custom && (
        <View style={layout.wrap}>
          {CURRENCIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={c === (currency ?? l.preferences.currency)}
              onPress={() => setCurrency(c)}
            />
          ))}
        </View>
      )}
      <Copy muted>All expenses in this group use this currency. No exchange-rate conversion.</Copy>
    </Page>
  );
}
