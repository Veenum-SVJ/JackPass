import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from './supabase-utils';

let client: SupabaseClient | null = null;

/**
 * Create (and memoize) the browser Supabase client.
 * Env vars are exposed to the client via Vite's VITE_ prefix.
 */
export const createBrowserSupabase = (): SupabaseClient => {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      console.error('Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      // Return a dummy client that won't crash the app — data fetching will fail gracefully
      client = createClient('https://placeholder.supabase.co', 'placeholder-key');
      return client;
    }

    client = createClient(normalizeSupabaseUrl(url), anonKey);
  }
  return client;
};

/**
 * Get the current user's session access token for authenticated API calls.
 */
export const getSessionToken = async (): Promise<string | null> => {
  const { data } = await createBrowserSupabase().auth.getSession();
  return data.session?.access_token ?? null;
};
