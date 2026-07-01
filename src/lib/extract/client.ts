import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Transport for the `extract` Edge Function — the one backend that turns a
 * receipt photo, a recipe photo, or a recipe link into structured data via
 * Claude. The ANTHROPIC_API_KEY lives only on the server; the app just invokes
 * the function (Supabase attaches the user's auth automatically).
 */

export type ExtractRequest =
  | { kind: 'receipt'; image: string; imageType?: string }
  | { kind: 'recipe'; image: string; imageType?: string }
  | { kind: 'recipe'; url: string };

/** Calls the function and returns its JSON, or throws a user-readable error. */
export async function invokeExtract<T>(body: ExtractRequest): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error('Cloud features need Supabase set up — add your keys to .env.');
  }
  const { data, error } = await getSupabase().functions.invoke('extract', { body });
  if (error) throw new Error(error.message || 'Extraction failed.');
  if (data?.error) throw new Error(data.error);
  return data as T;
}
