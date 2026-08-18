import { Router } from 'express';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAuth } from '../middleware';

export const subscriptionRouter = Router();

/**
 * GET /api/user/subscription
 * Fetch the current user's subscription (falls back to free tier).
 */
subscriptionRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const user = res.locals.user as { id: string };
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // PGRST116 = no rows found
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json(data || { tier: 'free', status: 'active' });
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch subscription' });
  }
});
