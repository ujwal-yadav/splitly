import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ErrorText, Heading, Page, Panel } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
import { supabase } from '@/lib/supabase';
export default function Join() {
  const l = useLedger();
  const r = useRouter();
  const p = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(p.code ?? '');
  const [preview, setPreview] = useState<{ name: string; person: string; currency: string } | null>(
    null,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Page title="Join a group">
      <Copy>Enter the invitation code shared by the group creator.</Copy>
      <Input
        label="Invitation code"
        value={code}
        onChangeText={(v) => {
          setCode(v);
          setPreview(null);
        }}
        autoCapitalize="none"
      />
      <Button
        title="Preview invitation"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError('');
          try {
            const { data, error } = await supabase.rpc('preview_ledger_invite', {
              p_token: code.trim(),
            });
            if (error) throw error;
            setPreview(data);
          } catch {
            setError(
              'This invitation is invalid, expired, or already used. Ask the creator for a new code.',
            );
          } finally {
            setBusy(false);
          }
        }}
      />

      {preview && (
        <Panel>
          <Heading>{preview.name}</Heading>
          <Copy>
            {preview.currency} · Join as {preview.person}
          </Copy>
          <Copy>
            Joining gives you access to this group’s expenses, receipts, payments and member names.
            Other members can see your changes.
          </Copy>
          <Button
            title={`Join as ${preview.person}`}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                const { data, error } = await supabase.rpc('accept_ledger_invite', {
                  p_token: code.trim(),
                });
                if (error) throw error;
                await l.refresh();
                r.replace({ pathname: '/group/[id]', params: { id: data } });
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </Panel>
      )}
      <ErrorText message={error} />
    </Page>
  );
}
