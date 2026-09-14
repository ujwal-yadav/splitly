import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { SearchInput } from '@/components/ui/search-input';
import { AccountButton, Copy, GroupRow, Page, Panel, layout } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
export default function Groups() {
  const l = useLedger();
  const r = useRouter();
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const groups = l.groups.filter(
    (g) => g.archived === archived && g.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Page title="Groups" tab action={<AccountButton />} refresh>
      <Button title="Create group" onPress={() => r.push('/create-group')} />
      <SearchInput value={q} onChangeText={setQ} placeholder="Search groups" />
      <View style={layout.wrap}>
        <Chip label="Active" selected={!archived} onPress={() => setArchived(false)} />
        <Chip label="Archived" selected={archived} onPress={() => setArchived(true)} />
      </View>
      {groups.map((g) => (
        <GroupRow key={g.id} group={g} />
      ))}
      {!groups.length && (
        <Panel>
          <Copy>
            {q
              ? 'No groups match your search.'
              : archived
                ? 'No archived groups.'
                : 'Create a group and add the people sharing your expenses.'}
          </Copy>
        </Panel>
      )}
    </Page>
  );
}
