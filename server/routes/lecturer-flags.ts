import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware';
import { createServerSupabase } from '../../src/lib/supabase-server';

export const lecturerFlagsRouter = Router();

// ── LIST pending flags (admin) ───────────────────────────────────────────
lecturerFlagsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('lecturer_flags')
      .select('*, reporter:reporter_id(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error('Error listing flags:', error);
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
});

// ── CREATE a flag (authenticated) ────────────────────────────────────────
lecturerFlagsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user as { id: string };
    const { target_type, target_id, reason } = req.body;

    if (!target_type || !target_id) {
      res.status(400).json({ error: 'target_type and target_id are required' });
      return;
    }

    if (!['lecturer', 'review', 'photo'].includes(target_type)) {
      res.status(400).json({ error: 'target_type must be lecturer, review, or photo' });
      return;
    }

    const { data, error } = await supabase
      .from('lecturer_flags')
      .insert([{
        target_type,
        target_id,
        reporter_id: user.id,
        reason: reason || '',
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating flag:', error);
    res.status(500).json({ error: error.message || 'Failed to create flag' });
  }
});

// ── RESOLVE a flag (admin) ───────────────────────────────────────────────
lecturerFlagsRouter.patch('/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ error: 'status must be resolved or dismissed' });
      return;
    }

    const { data, error } = await supabase
      .from('lecturer_flags')
      .update({ status, admin_note: admin_note || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If resolved, delete the flagged content
    if (status === 'resolved') {
      const flag = data as { target_type: string; target_id: string };
      if (flag.target_type === 'review') {
        await supabase.from('lecturer_reviews').delete().eq('id', flag.target_id);
      } else if (flag.target_type === 'photo') {
        await supabase.from('lecturer_photos').delete().eq('id', flag.target_id);
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error resolving flag:', error);
    res.status(500).json({ error: error.message || 'Failed to resolve flag' });
  }
});
