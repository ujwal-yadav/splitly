import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import * as authService from '@/services/auth';
import type { Profile } from '@/types/database';

interface AuthState {
  finishRecovery: () => void;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthState>({
  finishRecovery: () => {},
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  resetPassword: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [recovery, setRecovery] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const router = useRouter();
  const segments = useSegments();
  const navigation = useRootNavigationState();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const subscription = authService.onAuthStateChange((newSession, event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovery(true);
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || Platform.OS === 'web') return;
    const handle = async (url: string | null) => {
      if (!url || !url.includes('update-password')) return;
      const parameters = new URLSearchParams(url.split('#')[1] ?? '');
      const access_token = parameters.get('access_token');
      const refresh_token = parameters.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) {
          setRecovery(true);
        }
      }
    };
    void Linking.getInitialURL().then(handle);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handle(url);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (recovery && navigation?.key && segments[segments.length - 1] !== 'update-password')
      router.replace('/(auth)/update-password');
  }, [recovery, navigation?.key, segments, router]);

  useEffect(() => {
    if (loading || !navigation?.key) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const inOnboarding = firstSegment === 'onboarding';
    const isIndex = !firstSegment || firstSegment === 'index';

    if (!session && !inAuthGroup && !inOnboarding && !isIndex) {
      router.replace('/(auth)/login' as never);
    }
  }, [session, segments, loading, navigation?.key, router]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return 'Account sign-in is unavailable. Please try again later.';
    }
    const result = await authService.signIn(email, password);
    if (result.error) return result.error.message;
    setUser(result.data.user);
    setSession(result.data.session);
    const userProfile = await authService.getProfile(result.data.user.id);
    setProfile(userProfile);
    return null;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return 'Account sign-in is unavailable. Please try again later.';
    }
    const result = await authService.signUp(email, password, fullName);
    if (result.error) return result.error.message;
    setUser(result.data.session ? result.data.user : null);
    setSession(result.data.session);
    return null;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await authService.signOut();
      if (error) throw error;
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setRecovery(false);
    router.replace('/(auth)/login' as never);
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return 'Password reset is not configured for this build.';
    const { error } = await authService.resetPassword(email);
    return error ? error.message : null;
  };

  return (
    <AuthContext.Provider
      value={{
        finishRecovery: () => setRecovery(false),
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
