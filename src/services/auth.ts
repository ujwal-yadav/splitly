import * as Linking from 'expo-linking';
import type { AuthError, Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export type AuthResult<T = void> = { data: T; error: null } | { data: null; error: AuthError };

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult<{ user: User; session: Session | null }>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error || !data.user) {
    return { data: null, error: error ?? ({ message: 'Sign up failed' } as AuthError) };
  }
  return { data: { user: data.user, session: data.session }, error: null };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User; session: Session }>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    return { data: null, error: error ?? ({ message: 'Sign in failed' } as AuthError) };
  }
  return { data: { user: data.user, session: data.session }, error: null };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL('/update-password'),
  });
  return { error };
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'username' | 'phone' | 'avatar_url' | 'currency'>>,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  return { error };
}

export function onAuthStateChange(callback: (session: Session | null, event: string) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, _event);
  });
  return data.subscription;
}
