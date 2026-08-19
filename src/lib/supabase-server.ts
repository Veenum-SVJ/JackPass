import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from './supabase-utils';

export const createServerSupabase = () => createClient(
  normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.is_admin === true;
}
