import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Share, Switch, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Copy, ErrorText, Page, Panel, Row, layout } from '@/components/ui/ledger-ui';
import { useAuth } from '@/contexts/auth-context';
import { useLedger } from '@/contexts/ledger-context';
export default function Settings() {
  const l = useLedger();
  const a = useAuth();
  const r = useRouter();
  const [error, setError] = useState('');
  return (
    <Page title="Preferences">
      <Row
        title="Default currency"
        subtitle={`${l.preferences.currency} · For new groups only`}
        onPress={() => r.push('/currency-selector')}
      />
      <Panel>
        <View style={layout.row}>
          <View style={{ flex: 1 }}>
            <Copy>Hide amounts on Home</Copy>
            <Copy muted>Tap into balances to see the details.</Copy>
          </View>
          <Switch
            accessibilityLabel="Hide amounts on Home"
            value={l.preferences.hideAmounts}
            disabled={l.busy}
            onValueChange={async (v) => {
              try {
                await l.savePreferences({ ...l.preferences, hideAmounts: v });
              } catch (e) {
                setError(String(e));
              }
            }}
          />
        </View>
      </Panel>
      <Row
        title="Payment preference"
        subtitle={l.preferences.paymentMethod}
        onPress={() => r.push('/payment-methods')}
      />
      <Panel>
        <Copy>Saved to your account</Copy>
        <Copy muted>
          Groups are shared with people who accept an invitation. Pull down on a list to refresh
          changes.
        </Copy>
        <Button
          title="Export my records"
          variant="outline"
          onPress={async () => {
            try {
              await Share.share({
                title: 'Splitly records',
                message: JSON.stringify(
                  {
                    exportedAt: new Date().toISOString(),
                    groups: l.groups,
                    preferences: l.preferences,
                  },
                  null,
                  2,
                ),
              });
            } catch (e) {
              setError(String(e));
            }
          }}
        />
      </Panel>
      <Copy muted>
        Push notifications and automatic reminders are not enabled in this version. Activity shows
        your saved group changes.
      </Copy>
      <Row title="Help and data information" onPress={() => r.push('/help-support')} />
      <Button
        title="Sign out"
        variant="outline"
        onPress={async () => {
          try {
            await a.signOut();
          } catch (e) {
            setError(String(e));
          }
        }}
      />
      <ErrorText message={error} />
    </Page>
  );
}
