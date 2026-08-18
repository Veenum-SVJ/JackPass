/**
 * Normalize a Supabase project URL for use with supabase-js.
 *
 * Some environment files include the `/rest/v1/` API path. supabase-js appends
 * that path itself, so a baked-in path produces PGRST125 "Invalid path" errors.
 */
export function normalizeSupabaseUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}
