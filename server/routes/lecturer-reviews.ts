import { Router } from 'express';
import { requireAuth } from '../middleware';
import { createServerSupabase } from '@/lib/supabase-server';

export const lecturerReviewsRouter = Router();

// ── LIST reviews for a lecturer ──────────────────────────────────────────
lecturerReviewsRouter.get('/lecturer/:lecturerId', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { lecturerId } = req.params;

    const { data, error } = await supabase
      .from('lecturer_reviews')
      .select('*, user_profiles:user_id(name, avatar)')
      .eq('lecturer_id', lecturerId)
      .order('upvotes', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error('Error listing reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ── CREATE or UPDATE a review (one per user per lecturer) ─────────────────
lecturerReviewsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user as { id: string };

    const { lecturer_id, rating, relationship, review_text, is_anonymous } = req.body;

    if (!lecturer_id || !rating) {
      res.status(400).json({ error: 'lecturer_id and rating are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'rating must be between 1 and 5' });
      return;
    }

    // Upsert: one review per user per lecturer
    const { data, error } = await supabase
      .from('lecturer_reviews')
      .upsert({
        lecturer_id,
        user_id: user.id,
        rating,
        relationship: relationship || 'student',
        review_text: review_text || '',
        is_anonymous: is_anonymous || false,
      }, { onConflict: 'lecturer_id,user_id' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error saving review:', error);
    res.status(500).json({ error: error.message || 'Failed to save review' });
  }
});

// ── DELETE a review (author only) ────────────────────────────────────────
lecturerReviewsRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user as { id: string };
    const { id } = req.params;

    const { error } = await supabase
      .from('lecturer_reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ── VOTE on a review ─────────────────────────────────────────────────────
lecturerReviewsRouter.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user as { id: string };
    const { id } = req.params;
    const { value } = req.body; // 1 or -1

    if (value !== 1 && value !== -1) {
      res.status(400).json({ error: 'value must be 1 or -1' });
      return;
    }

    // Use the RPC function for atomic voting
    const { error } = await supabase.rpc('vote_on_review', {
      p_review_id: id,
      p_user_id: user.id,
      p_value: value,
    });

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error voting:', error);
    res.status(500).json({ error: error.message || 'Failed to vote' });
  }
});
