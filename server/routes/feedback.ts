import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { requireAuth } from '../middleware';

export const feedbackRouter = Router();

interface FeedbackItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  user_id: string | null;
  created_at: string;
}

interface VoteRow {
  item_id: string;
  user_id: string;
}

/**
 * GET /api/feedback?category= — public board, sorted by vote count.
 * When an auth token is supplied, each item includes `myVote`.
 */
feedbackRouter.get('/', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const supabase = createServerSupabase();

    let query = supabase
      .from('feedback_items')
      .select('id, title, description, category, status, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (category) query = query.eq('category', category);

    const { data: items, error } = await query;
    if (error) throw error;

    const rows = (items ?? []) as FeedbackItem[];
    if (rows.length === 0) {
      res.json({ items: [] });
      return;
    }

    const ids = rows.map((r) => r.id);
    const { data: votes, error: votesError } = await supabase
      .from('feedback_votes')
      .select('item_id, user_id')
      .in('item_id', ids);
    if (votesError) throw votesError;

    const counts = new Map<string, number>();
    const voterIds = new Set<string>();
    for (const v of (votes ?? []) as VoteRow[]) {
      counts.set(v.item_id, (counts.get(v.item_id) ?? 0) + 1);
      voterIds.add(v.user_id);
    }

    // Optional: mark which items the current user voted for
    let myVotes = new Set<string>();
    const { getUserFromRequest, getBearerToken } = await import('../middleware');
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user && voterIds.size > 0) {
        const { data: mine } = await supabase
          .from('feedback_votes')
          .select('item_id')
          .eq('user_id', user.id)
          .in('item_id', ids);
        myVotes = new Set((mine ?? []).map((v) => (v as { item_id: string }).item_id));
      }
    }

    const itemsWithVotes = rows.map((item) => ({
      ...item,
      votes: counts.get(item.id) ?? 0,
      myVote: myVotes.has(item.id),
    }));
    itemsWithVotes.sort((a, b) => b.votes - a.votes);

    res.json({ items: itemsWithVotes });
  } catch (error: any) {
    console.error('Error loading feedback:', error);
    res.status(500).json({ error: 'Failed to load feedback' });
  }
});

/** POST /api/feedback — create a feature request (authenticated). */
feedbackRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category } = req.body ?? {};
    const user = res.locals.user as { id: string };

    if (!title || typeof title !== 'string' || title.trim().length < 5 || title.length > 160) {
      res.status(400).json({ error: 'Title must be between 5 and 160 characters' });
      return;
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('feedback_items')
      .insert({
        title: title.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim().slice(0, 2000) : null,
        category: typeof category === 'string' && category.trim() ? category.trim().slice(0, 50) : 'General',
        user_id: user.id,
      })
      .select('id, title, description, category, status, user_id, created_at')
      .single();

    if (error) throw error;

    res.status(201).json({ item: { ...data, votes: 0, myVote: false } });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: error.message || 'Failed to create feedback' });
  }
});

/** POST /api/feedback/:id/vote — toggle the current user's vote (authenticated). */
feedbackRouter.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = res.locals.user as { id: string };
    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('feedback_votes')
      .select('item_id')
      .eq('item_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    let voted: boolean;
    if (existing) {
      await supabase.from('feedback_votes').delete().eq('item_id', id).eq('user_id', user.id);
      voted = false;
    } else {
      await supabase.from('feedback_votes').insert({ item_id: id, user_id: user.id });
      voted = true;
    }

    const { count } = await supabase
      .from('feedback_votes')
      .select('item_id', { count: 'exact', head: true })
      .eq('item_id', id);

    res.json({ voted, votes: count ?? 0 });
  } catch (error: any) {
    console.error('Error toggling feedback vote:', error);
    res.status(500).json({ error: 'Failed to update vote' });
  }
});