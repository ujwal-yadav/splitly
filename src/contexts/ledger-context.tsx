import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { defaults, id, type Draft, type Group, type Preferences } from '@/domain/ledger';
import { supabase } from '@/lib/supabase';

type Stored = {
  version: 1;
  revision: number;
  groups: Group[];
  preferences: Preferences;
  draft: Draft | null;
};
const empty = (): Stored => ({
  version: 1,
  revision: 0,
  groups: [],
  preferences: { ...defaults },
  draft: null,
});
type LedgerContextType = Stored & {
  loading: boolean;
  error: string;
  busy: boolean;
  userId: string;
  refresh: () => Promise<void>;
  saveGroup: (group: Group, emails?: string[]) => Promise<void>;
  savePreferences: (p: Preferences) => Promise<void>;
  saveDraft: (draft: Draft | null) => Promise<void>;
};
const Context = createContext<LedgerContextType | null>(null);
export function LedgerProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const userId = user?.id ?? 'signed-out';
  // Remount on identity changes so drafts and records never cross account boundaries.
  return (
    <AccountLedger
      key={userId}
      userId={userId}
      name={user?.user_metadata?.full_name}
      wait={authLoading || !session}
    >
      {children}
    </AccountLedger>
  );
}
function AccountLedger({
  children,
  userId,
  name,
  wait,
}: {
  children: ReactNode;
  userId: string;
  name?: string;
  wait: boolean;
}) {
  const key = `splitly-ledger-v1:${userId}`;
  const [state, setState] = useState<Stored>(empty);
  const current = useRef(state);
  const lock = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const apply = (next: Stored) => {
    current.current = next;
    if (mounted.current) setState(next);
  };
  const read = async () => {
    const raw = await AsyncStorage.getItem(key);
    const cached: Stored = raw ? JSON.parse(raw) : empty();
    if (cached.version !== 1 || !Array.isArray(cached.groups))
      throw new Error(
        'This device’s records could not be opened. Export a backup before resetting storage.',
      );
    const [{ data: groups, error: ge }, { data: account, error: ae }] = await Promise.all([
      supabase
        .from('ledger_groups')
        .select('document, revision')
        .order('updated_at', { ascending: false }),
      supabase.from('ledger_accounts').select('preferences').eq('user_id', userId).maybeSingle(),
    ]);
    if (ge || ae)
      throw new Error(
        'Account data could not be loaded. Check your connection or try again later.',
      );
    return {
      ...cached,
      groups: (groups ?? []).map((g) => ({ ...g.document, revision: g.revision })),
      preferences: account?.preferences ?? { ...defaults, name: name || 'You' },
    } as Stored;
  };
  const refresh = async () => {
    if (lock.current) return;
    const request = ++generation.current;
    try {
      const next = await read();
      if (request !== generation.current || !mounted.current) return;
      apply(next);
      setError('');
    } catch (e) {
      if (request === generation.current && mounted.current)
        setError(e instanceof Error ? e.message : 'Could not load your records.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    if (!wait) {
      // Hydration reads external storage; start it after mounting the subscription.
      void Promise.resolve().then(refresh);
    }
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && !wait) void refresh();
    });
    const onFocus = () => {
      if (!wait) void refresh();
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined')
      window.addEventListener('focus', onFocus);
    // Discover new memberships even while the recipient keeps Home open.
    const timer = setInterval(() => {
      if (
        !wait &&
        AppState.currentState === 'active' &&
        (Platform.OS !== 'web' || typeof document === 'undefined' || !document.hidden)
      )
        void refresh();
    }, 10000);
    return () => {
      clearInterval(timer);
      mounted.current = false;
      sub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined')
        window.removeEventListener('focus', onFocus);
    };
    // Identity is fixed for this provider instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wait]);
  const mutate = async (operation: (s: Stored) => Promise<Stored>) => {
    if (wait || userId === 'signed-out') throw new Error('Sign in before saving records.');
    if (loading || error) throw new Error('Load your records successfully before saving.');
    if (lock.current) throw new Error('A save is already in progress. Please try again.');
    lock.current = true;
    generation.current++;
    setBusy(true);
    const run = async () => {
      const next = await operation(current.current);
      apply(next);
    };
    try {
      // Serialize browser tabs as well as duplicate taps in this window.
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.locks)
        await navigator.locks.request(key, run);
      else await run();
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const saveGroup = async (group: Group, emails: string[] = []) =>
    mutate(async (s) => {
      const knownEvents = new Set(
        s.groups.find((g) => g.id === group.id)?.events.map((e) => e.id) ?? [],
      );
      group = {
        ...group,
        events: group.events.map((e) =>
          knownEvents.has(e.id) ? e : { ...e, actorName: s.preferences.name },
        ),
      };
      let saved = { ...group, revision: group.revision + 1 };
      const existing = s.groups.find((g) => g.id === group.id);
      if (existing && existing.revision !== group.revision)
        throw new Error('This group changed. Review the latest details and try again.');
      {
        const { data, error } = await (emails.length
          ? supabase.rpc('create_ledger_group_with_emails', {
              p_document: group,
              p_emails: emails,
            })
          : supabase.rpc('save_ledger_group', {
              p_document: group,
              p_revision: group.revision,
            }));
        if (error)
          throw new Error(
            error.message.includes('conflict')
              ? 'This group changed on another device. Refresh before trying again.'
              : error.message,
          );
        saved = emails.length ? (data as Group) : { ...group, revision: data };
      }
      return {
        ...s,
        groups: existing
          ? s.groups.map((g) => (g.id === group.id ? saved : g))
          : [saved, ...s.groups],
      };
    });
  const savePreferences = async (preferences: Preferences) =>
    mutate(async (s) => {
      if (!preferences.name.trim()) throw new Error('Enter your name.');
      {
        const { error } = await supabase
          .from('ledger_accounts')
          .upsert({ user_id: userId, preferences });
        if (error) throw error;
      }
      return { ...s, preferences };
    });
  const saveDraft = async (draft: Draft | null) =>
    mutate(async (s) => {
      const next = { ...s, draft };
      await AsyncStorage.setItem(key, JSON.stringify({ ...empty(), draft }));
      return next;
    });
  return (
    <Context.Provider
      value={{
        ...state,
        loading,
        error,
        busy,
        userId,
        refresh,
        saveGroup,
        savePreferences,
        saveDraft,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLedger() {
  const value = useContext(Context);
  if (!value) throw new Error('LedgerProvider is missing');
  return value;
}
export function event(
  type: 'expense' | 'payment' | 'group',
  title: string,
  detail: string,
  targetId?: string,
) {
  return { id: id(), type, title, detail, targetId, at: new Date().toISOString() };
}
