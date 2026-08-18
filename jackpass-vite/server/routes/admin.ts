import { Router } from 'express';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '../middleware';

export const adminRouter = Router();

/**
 * GET /api/admin/questions
 * Fetch questions for moderation. Supports ?search, ?status, ?institution and ?institutions=true.
 */
adminRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();

    if (req.query.institutions === 'true') {
      const { data, error } = await supabase
        .from('questions')
        .select('institution')
        .order('institution');

      if (error) throw error;

      const uniqueInstitutions = [...new Set((data ?? []).map((q) => q.institution))];
      res.json(uniqueInstitutions);
      return;
    }

    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const institution = typeof req.query.institution === 'string' ? req.query.institution : undefined;

    if (search) {
      query = query.or(`title.ilike.%${search}%,institution.ilike.%${search}%,course.ilike.%${search}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (institution) {
      query = query.eq('institution', institution);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching admin questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * POST /api/admin/questions/:id/:action
 * Approve or reject a question.
 */
adminRouter.post('/:id/:action', requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const action = String(req.params.action);
  const user = res.locals.user as { id: string };

  try {
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      return;
    }

    const supabase = createServerSupabase();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('questions')
      .update({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json({
      success: true,
      question: data,
      message: `Question ${action}d successfully`,
    });
  } catch (error: any) {
    console.error(`Error ${action}ing question:`, error);
    res.status(500).json({ error: error.message || `Failed to ${action} question` });
  }
});
