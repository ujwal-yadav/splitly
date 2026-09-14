import { MotionProvider, useMotionReduced } from '@/contexts/motion-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { LedgerProvider } from '@/contexts/ledger-context';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/contexts/toast-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <MotionProvider>
      <RootNavigator />
    </MotionProvider>
  );
}

function RootNavigator() {
  const reduced = useMotionReduced();
  const scheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <LedgerProvider>
        <ToastProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="create-group"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="group/[id]"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="add-transaction"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="transaction/[id]"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="settle-up"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="settings"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="split-options"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="payment-method"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="payment-success"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="edit-profile"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="payment-methods"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="currency-selector"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="help-support"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
            <Stack.Screen
              name="scan-bill"
              options={{ animation: reduced ? 'none' : 'slide_from_right' }}
            />
          </Stack>
        </ToastProvider>
      </LedgerProvider>
    </AuthProvider>
  );
}
