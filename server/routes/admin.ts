import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { requireAdmin, requireAuth } from '../middleware';

// ── Base admin routes (mounted at /api/admin) ────────────────
export const adminBaseRouter = Router();

/**
 * GET /api/admin/me
 * Check if the current authenticated user is an admin.
 * Uses service-role key to bypass RLS.
 */
adminBaseRouter.get('/me', requireAuth, async (_req, res) => {
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
adminBaseRouter.get('/stats', requireAdmin, async (_req, res) => {
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

// ── Question moderation routes (mounted at /api/admin/questions) ──
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
 * POST /api/admin/questions/bulk/:action
 * Bulk approve or reject multiple exam papers.
 */
adminRouter.post('/bulk/:action', requireAdmin, async (req, res) => {
  const action = String(req.params.action);
  const user = res.locals.user as { id: string };

  try {
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
      return;
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'ids must be a non-empty array' });
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
      .in('id', ids)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      count: data?.length ?? 0,
      message: `${data?.length ?? 0} exam paper(s) ${action}d successfully`,
    });
  } catch (error: any) {
    console.error(`Error bulk ${action}ing questions:`, error);
    res.status(500).json({ error: error.message || `Failed to bulk ${action} questions` });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Update exam paper content (title, full_content, content_preview, answer, explanation, etc.).
 */
adminRouter.put('/:id', requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  try {
    const supabase = createServerSupabase();

    // Only allow updating specific fields
    const allowedFields = ['title', 'institution', 'course', 'course_code', 'year', 'semester', 'type', 'content_preview', 'full_content', 'answer', 'explanation'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length <= 1) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Exam paper not found' });
      return;
    }

    res.json({ success: true, question: data, message: 'Exam paper updated successfully' });
  } catch (error: any) {
    console.error('Error updating exam paper:', error);
    res.status(500).json({ error: error.message || 'Failed to update exam paper' });
  }
});

/**
 * POST /api/admin/questions/:id/:action
 * Approve or reject a question.
 */
adminRouter.post('/:id/reprocess', requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  try {
    const supabase = createServerSupabase();

    // Fetch the question to get file_url
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('id, file_url, file_name')
      .eq('id', id)
      .single();

    if (fetchError || !question) {
      res.status(404).json({ error: 'Exam paper not found' });
      return;
    }

    if (!question.file_url) {
      res.status(400).json({ error: 'No file URL available for re-processing' });
      return;
    }

    // Update status to processing
    await supabase
      .from('questions')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Import and run Gemini Vision OCR
    const { extractTextFromBase64 } = await import('../../src/lib/ocr');
    const { processUploadedQuestionFlow } = await import('../../src/ai/flows/process-uploaded-question');

    // Fetch the file and convert to base64
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(question.file_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';

    console.log(`Re-processing OCR for question ${id} (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);

    // Run Gemini Vision OCR
    const { text: ocrText, confidence: ocrConfidence } = await extractTextFromBase64(base64, mimeType);

    console.log(`OCR re-processing completed: ${ocrText.length} chars extracted`);

    // Run AI metadata extraction with the new OCR text
    const result = await processUploadedQuestionFlow({
      uploadId: id,
      ocrText,
      filename: question.file_name || 'reprocessed.pdf',
      uploaderId: 'admin-reprocess',
    });

    if (!result.success) {
      throw new Error(result.error || 'AI extraction failed during re-processing');
    }

    // Fetch the updated question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      question: updatedQuestion,
      message: 'Exam paper re-processed successfully',
      ocrConfidence,
    });
  } catch (error: any) {
    console.error('Error re-processing exam paper:', error);
    // Reset status back to pending on failure
    try {
      const supabaseClient = createServerSupabase();
      await supabaseClient.from('questions').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', id);
    } catch (resetError) {
      console.error('Failed to reset question status:', resetError);
    }
    res.status(500).json({ error: error.message || 'Failed to re-process exam paper' });
  }
});

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

// ── User Management (mounted at /api/admin/users) ──────────────
export const adminUsersRouter = Router();

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
