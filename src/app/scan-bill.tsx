import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import { Button } from '@/components/ui/button';
import { Copy, ErrorText, Page, Panel } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
import { choosePhoto } from '@/services/attachments';
export default function Receipt() {
  const l = useLedger();
  const r = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (camera: boolean) => {
    setBusy(true);
    setError('');
    try {
      const result = await choosePhoto(camera);
      if (result) setImage(result);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Attach receipt">
      {!l.draft ? (
        <Panel>
          <Copy>Open an expense to attach its receipt.</Copy>
          <Button title="Add expense" onPress={() => r.replace('/add-transaction')} />
        </Panel>
      ) : (
        <>
          <Copy>
            Add a photo for reference. Enter the amount and description yourself; receipt text is
            not extracted.
          </Copy>
          {image && (
            <Image
              source={{ uri: image }}
              style={{ height: 360, width: '100%' }}
              resizeMode="contain"
            />
          )}
          <Button title="Take a receipt photo" onPress={() => void pick(true)} loading={busy} />
          <Button
            title="Choose an image"
            variant="outline"
            onPress={() => void pick(false)}
            disabled={busy}
          />
          {image && (
            <Button
              title="Attach to expense"
              loading={l.busy}
              onPress={async () => {
                try {
                  await l.saveDraft({ ...l.draft!, receipt: image });
                  r.back();
                } catch (e) {
                  setError(String(e));
                }
              }}
            />
          )}
          <Copy muted>
            Use a small, readable image. The attachment is saved with the expense, and is visible to
            group members in account mode.
          </Copy>
        </>
      )}
      <ErrorText message={error} />
    </Page>
  );
}
