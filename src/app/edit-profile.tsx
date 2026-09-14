import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ErrorText, Page, Panel } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
import { choosePhoto } from '@/services/attachments';
export default function ProfileEditor() {
  const l = useLedger();
  if (l.loading) return <Page title="Edit profile">{null}</Page>;
  return <Form />;
}
function Form() {
  const l = useLedger();
  const r = useRouter();
  const [name, setName] = useState(l.preferences.name);
  const [photo, setPhoto] = useState(l.preferences.photo);
  const [error, setError] = useState('');
  return (
    <Page
      title="Edit profile"
      footer={
        <>
          <ErrorText message={error} />
          <Button
            title="Save changes"
            loading={l.busy}
            onPress={async () => {
              try {
                if (!name.trim()) throw new Error('Enter your name.');
                await l.savePreferences({ ...l.preferences, name: name.trim(), photo });
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
        {photo && (
          <Image
            source={{ uri: photo }}
            style={{ width: 96, height: 96, borderRadius: 48, alignSelf: 'center' }}
          />
        )}
        <Button
          title="Choose profile photo"
          variant="outline"
          onPress={async () => {
            try {
              const result = await choosePhoto(false, true);
              if (result) setPhoto(result);
            } catch (e) {
              setError(String(e));
            }
          }}
        />
        {photo && (
          <Button title="Remove photo" variant="ghost" onPress={() => setPhoto(undefined)} />
        )}
      </Panel>
      <Input label="Your name" value={name} onChangeText={setName} maxLength={60} />
      <Copy muted>
        Your name is used when you create or join a group. Existing group records keep the name they
        were created with.
      </Copy>
    </Page>
  );
}
