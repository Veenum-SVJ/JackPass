import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { requireAdmin, requireAuth } from '../middleware';

export const adminRouter = Router();
export const adminUsersRouter = Router();

/**
 * GET /api/admin/me
 * Check if the current authenticated user is an admin.
 * Uses service-role key to bypass RLS.
 */
adminRouter.get('/me', requireAuth, async (_req, res) => {
  try {
    const user = res.locals.user as { id: string };
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      res.json({ isAdmin: false });
      return;
    }

    res.json({ isAdmin: data.is_admin === true });
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    res.json({ isAdmin: false });
  }
});

/**
 * GET /api/admin/stats
 * Dashboard statistics: total questions, pending, approved, rejected, total users.
 */
adminRouter.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const supabase = createServerSupabase();

    const [questionsResult, usersResult] = await Promise.all([
      supabase.from('questions').select('status'),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    ]);

    if (questionsResult.error) throw questionsResult.error;

    const questions = questionsResult.data ?? [];
    const total = questions.length;
    const pending = questions.filter((q) => q.status === 'pending').length;
    const approved = questions.filter((q) => q.status === 'approved').length;
    const rejected = questions.filter((q) => q.status === 'rejected').length;
    const totalUsers = usersResult.count ?? 0;

    res.json({ total, pending, approved, rejected, totalUsers });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

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

// ── User Management ──────────────────────────────────────────

/**
 * GET /api/admin/users
 * List all users with their profile data.
 */
adminUsersRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    // Fetch user profiles
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    const { data: profiles, error: profileError } = await query.limit(100);
    if (profileError) throw profileError;

    // Fetch auth users to get email addresses
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Merge profiles with auth user emails
    const authUserMap = new Map((authUsers?.users ?? []).map((u) => [u.id, u]));
    const users = (profiles ?? []).map((profile) => {
      const authUser = authUserMap.get(profile.id);
      return {
        ...profile,
        email: authUser?.email ?? 'Unknown',
        last_sign_in: authUser?.last_sign_in_at ?? null,
        email_confirmed: authUser?.email_confirmed_at != null,
      };
    });

    // Filter by search on email too
    const filtered = search
      ? users.filter((u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.name ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : users;

    res.json(filtered);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users/:id/promote
 * Grant admin privileges to a user.
 */
adminUsersRouter.post('/:id/promote', requireAdmin, async (req, res) => {
  const userId = String(req.params.id);

  try {
    // Prevent self-demotion issues (though promote is fine)
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, user: data, message: 'User promoted to admin' });
  } catch (error: any) {
    console.error('Error promoting user:', error);
    res.status(500).json({ error: error.message || 'Failed to promote user' });
  }
});

/**
 * POST /api/admin/users/:id/demote
 * Remove admin privileges from a user.
 */
adminUsersRouter.post('/:id/demote', requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  const currentUser = res.locals.user as { id: string };

  try {
    // Prevent self-demotion
    if (userId === currentUser.id) {
      res.status(400).json({ error: 'You cannot remove your own admin privileges' });
      return;
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_admin: false })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, user: data, message: 'Admin privileges removed' });
  } catch (error: any) {
    console.error('Error demoting user:', error);
    res.status(500).json({ error: error.message || 'Failed to demote user' });
  }
});
