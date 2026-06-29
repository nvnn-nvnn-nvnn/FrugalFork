import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

type AuthResult = { error?: string };

type AuthContextValue = {
  /** Whether real Supabase keys are present. False = app is local-only. */
  configured: boolean;
  /** False until the initial session check completes (true immediately if not configured). */
  ready: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const NOT_CONFIGURED: AuthResult = {
  error: 'Cloud accounts aren’t set up yet — add your Supabase keys to .env.',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { error } = await getSupabase().auth.signUp({ email: email.trim(), password });
    return { error: error?.message };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED;
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await getSupabase().auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      ready,
      session,
      user: session?.user ?? null,
      signUp,
      signIn,
      signOut,
    }),
    [ready, session, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
