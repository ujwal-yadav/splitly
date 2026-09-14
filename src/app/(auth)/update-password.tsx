import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Copy, ErrorText, layout } from '@/components/ui/ledger-ui';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
export default function NewPassword() {
  const a = useAuth();
  const r = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <ScreenHeader title="Choose a new password" />
      <ScrollView contentContainerStyle={layout.content} keyboardShouldPersistTaps="handled">
        {!a.session ? (
          <>
            <Copy>Your reset link is expired or unavailable. Request a new one.</Copy>
            <Button
              title="Request another link"
              onPress={() => {
                a.finishRecovery();
                r.replace('/(auth)/forgot-password');
              }}
            />
          </>
        ) : (
          <>
            <Input
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!visible}
              rightIcon={visible ? 'eye-outline' : 'eye-off-outline'}
              onRightIconPress={() => setVisible(!visible)}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!visible}
              autoComplete="new-password"
            />
            <Button
              title="Update password"
              loading={busy}
              onPress={async () => {
                if (password.length < 8) {
                  setError('Use at least eight characters.');
                  return;
                }
                if (password !== confirm) {
                  setError('Passwords do not match.');
                  return;
                }
                setBusy(true);
                try {
                  const { error } = await supabase.auth.updateUser({ password });
                  if (error) throw error;
                  a.finishRecovery();
                  r.replace('/(tabs)');
                } catch (e) {
                  setError(String(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </>
        )}
        <ErrorText message={error} />
      </ScrollView>
    </Screen>
  );
}
