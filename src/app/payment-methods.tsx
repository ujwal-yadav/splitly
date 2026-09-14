import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Copy, ErrorText, Page } from '@/components/ui/ledger-ui';
import { useLedger } from '@/contexts/ledger-context';
export default function PaymentPreferences() {
  const l = useLedger();
  const r = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  return (
    <Page
      title="Payment preference"
      footer={
        <>
          <ErrorText message={error} />
          <Button
            title="Save preference"
            loading={l.busy}
            onPress={async () => {
              try {
                await l.savePreferences({
                  ...l.preferences,
                  paymentMethod: selected ?? l.preferences.paymentMethod,
                });
                r.back();
              } catch (e) {
                setError(String(e));
              }
            }}
          />
        </>
      }
    >
      <Copy>Preselect a method when you record a payment. You can change it for each payment.</Copy>
      {['Bank transfer', 'UPI', 'Cash', 'Other'].map((m) => (
        <Chip
          key={m}
          label={m}
          selected={m === (selected ?? l.preferences.paymentMethod)}
          onPress={() => setSelected(m)}
        />
      ))}
      <Copy muted>
        No bank accounts, card details, or UPI credentials are stored. Payments happen outside
        Splitly.
      </Copy>
    </Page>
  );
}
