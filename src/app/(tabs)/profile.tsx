import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Copy, ErrorText, Heading, Page, Panel, Row } from '@/components/ui/ledger-ui';
import { useAuth } from '@/contexts/auth-context';
import { useLedger } from '@/contexts/ledger-context';
export default function Profile() {
  const l = useLedger();
  const a = useAuth();
  const r = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const logoutPending = useRef(false);

  const logout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true);
    setError('');
    try {
      await a.signOut();
    } catch {
      setError('Could not log out. Please try again.');
    } finally {
      logoutPending.current = false;
      setLoggingOut(false);
    }
  };
  return (
    <Page
      title="Profile"
      footer={
        <>
          <ErrorText message={error} />
          <Button title="Log out" variant="outline" loading={loggingOut} onPress={logout} />
        </>
      }
    >
      <Panel>
        {l.preferences.photo ? (
          <Image
            source={{ uri: l.preferences.photo }}
            style={{ width: 72, height: 72, borderRadius: 36 }}
          />
        ) : (
          <Avatar name={l.preferences.name} size="xl" />
        )}
        <Heading>{l.preferences.name}</Heading>
        <Copy muted>{a.user?.email}</Copy>
      </Panel>
      <Row
        title="Edit profile"
        subtitle="Your name and photo"
        onPress={() => r.push('/edit-profile')}
      />
      <Row
        title="Preferences"
        subtitle={`Default currency · ${l.preferences.currency}`}
        onPress={() => r.push('/settings')}
      />
      <Row
        title="Payment preference"
        subtitle={l.preferences.paymentMethod}
        onPress={() => r.push('/payment-methods')}
      />
      <Row
        title="Help"
        subtitle="How expenses and payments work"
        onPress={() => r.push('/help-support')}
      />
    </Page>
  );
}
