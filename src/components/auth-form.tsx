import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Copy, ErrorText, Heading, layout } from '@/components/ui/ledger-ui';
import { useAuth } from '@/contexts/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';
export function AuthForm({ mode }: { mode: 'login' | 'signup' | 'reset' }) {
  const a = useAuth();
  const r = useRouter();
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const lock = useRef(false);
  const title =
    mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password';
  const submit = async () => {
    if (lock.current) return;
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode !== 'reset' && (!password || (mode === 'signup' && password.length < 8))) {
      setError(mode === 'signup' ? 'Use at least eight characters.' : 'Enter your password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your name.');
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const message =
        mode === 'login'
          ? await a.signIn(email.trim(), password)
          : mode === 'signup'
            ? await a.signUp(email.trim(), password, name.trim())
            : await a.resetPassword(email.trim());
      if (message) throw new Error(message);
      if (mode === 'login')
        r.replace(invite ? { pathname: '/join-group', params: { code: invite } } : '/(tabs)');
      else setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return (
    <Screen>
      <ScreenHeader title={title} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={layout.content} keyboardShouldPersistTaps="handled">
          <Heading>
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'signup'
                ? 'Keep everyone in the loop'
                : 'Get back into your account'}
          </Heading>
          <Copy muted>
            {mode === 'reset'
              ? 'We’ll send a password reset link to your email.'
              : 'Share expenses with your groups and access your balances from any device.'}
          </Copy>
          {sent ? (
            <>
              <Copy>
                {mode === 'signup'
                  ? 'Check your email to confirm your account if required, then sign in.'
                  : 'If an account exists for this email, a reset link has been requested. Check your inbox.'}
              </Copy>
              <Button title="Back to sign in" onPress={() => r.replace('/(auth)/login')} />
            </>
          ) : (
            <>
              {mode === 'signup' && (
                <Input
                  label="Your name"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  maxLength={60}
                />
              )}
              <Input
                label="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {mode !== 'reset' && (
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!visible}
                  rightIcon={visible ? 'eye-outline' : 'eye-off-outline'}
                  onRightIconPress={() => setVisible(!visible)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              )}
              <ErrorText message={error} />
              <Button
                title={title}
                loading={busy}
                onPress={submit}
                disabled={!isSupabaseConfigured}
              />
              {!isSupabaseConfigured && (
                <Copy>Account access is temporarily unavailable. Please try again later.</Copy>
              )}
            </>
          )}
          {mode === 'login' && (
            <>
              <Button
                title="Forgot password?"
                variant="ghost"
                onPress={() => r.push('/(auth)/forgot-password')}
              />
              <Button
                title="Create account"
                variant="outline"
                onPress={() => r.push('/(auth)/sign-up')}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
