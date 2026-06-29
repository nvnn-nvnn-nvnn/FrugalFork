import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client. Keys come from `.env` (`EXPO_PUBLIC_SUPABASE_*`, see
 * `.env.example`). Until real keys are present the app stays **fully local** —
 * `isSupabaseConfigured` is false and the auth layer no-ops, so nothing breaks
 * offline. The anon key is a public, client-side key (safe to ship); never put
 * the `service_role` key here.
 *
 * The client is created **lazily** via `getSupabase()` — NOT at module load.
 * Expo's static web output pre-renders routes in Node, where `createClient`
 * (which spins up a Realtime/WebSocket client) throws "no native WebSocket".
 * Deferring construction to runtime (RN / browser) sidesteps that entirely.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  url.startsWith('https://') && url.includes('.supabase.co') && anonKey.length > 20;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      url || 'https://placeholder.supabase.co',
      anonKey || 'public-anon-placeholder-key',
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return client;
}
