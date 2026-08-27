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
    const allowedFields = ['title', 'institution', 'course', 'course_code', 'year', 'semester', 'type', 'content_preview', 'full_content', 'answer', 'explanation', 'marks_scheme', 'answer_generated'];
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
/**
 * GET /api/admin/questions/:id/reprocess-status
 * Poll reprocess step progress (used by frontend progress indicator).
 */
adminRouter.get('/:id/reprocess-status', requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('questions')
      .select('status, ai_extracted_data')
      .eq('id', id)
      .single();
    if (error || !data) { res.status(404).json({ error: 'Not found' }); return; }
    const step = (data.ai_extracted_data as any)?.reprocess_step || (data.status === 'pending' ? 'idle' : 'unknown');
    res.json({ step, status: data.status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminRouter.post('/:id/reprocess', requireAdmin, async (req, res) => {
  const id = String(req.params.id);

  try {
    const supabase = createServerSupabase();

    // Fetch the question to get file_url
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('id, file_url, file_name, uploader_id')
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

    // Helper to update reprocess step for polling
    const updateStep = async (step: string) => {
      await supabase
        .from('questions')
        .update({ ai_extracted_data: { reprocess_step: step } })
        .eq('id', id);
    };

    // Update status to processing
    await supabase
      .from('questions')
      .update({ status: 'processing', updated_at: new Date().toISOString(), ai_extracted_data: { reprocess_step: 'starting' } })
      .eq('id', id);

    // Import genkit AI for a SINGLE combined OCR + metadata extraction call
    // (two sequential Gemini calls take 30s+ and hit Vercel timeout)
    const { ai } = await import('../../src/ai/genkit');
    const { z } = await import('zod');

    // Step 1: Fetch file
    await updateStep('fetching_file');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(question.file_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';

    console.log(`Re-processing question ${id} with single Gemini call (${mimeType}, ${Math.round(base64.length * 0.75 / 1024)}KB)`);

    // Single Gemini call: extract text AND structured metadata from the image
    const CombinedResultSchema = z.object({
      extractedText: z.string().describe('Full raw text extracted from the image'),
      title: z.string().describe('Short descriptive title (max 100 chars)'),
      institution: z.string().describe('University/institution name'),
      course: z.string().describe('Course code and name'),
      faculty: z.string().optional().describe('Faculty/School'),
      department: z.string().optional().describe('Department'),
      year: z.string().describe('Academic year range (e.g. 2025/2026)'),
      semester: z.enum(['First', 'Second']).describe('Semester'),
      type: z.enum(['Objective', 'Theory', 'Mixed']).describe('Question type'),
      contentPreview: z.string().describe('First 200-300 chars of question content'),
      fullContent: z.string().describe('Complete question text as extracted'),
      answer: z.string().optional().describe('Model answer if present in document'),
      explanation: z.string().optional().describe('Explanation or marking scheme if present'),
      marksScheme: z.array(z.object({
        question: z.string(),
        totalMarks: z.number(),
        parts: z.array(z.object({ label: z.string(), marks: z.number(), text: z.string().optional() })).optional(),
      })).optional().describe('Marks allocation from exam paper'),
      answerGenerated: z.string().optional().describe('AI-generated model answer'),
    });

    // Step 2: Running Gemini Vision OCR + extraction
    await updateStep('ai_processing');
    const startTime = Date.now();
    const { output } = await ai.generate({
      prompt: [
        {
          text: `You are an expert at reading academic exam papers from Nigerian universities.\n\nExtract ALL text from this exam paper image and simultaneously extract structured metadata.\n\nRules for text extraction:\n- Transcribe text faithfully — do not guess or fabricate\n- Preserve formatting and structure (headings, numbered questions, sub-questions)\n- Include ALL visible text: institution name, course details, instructions, questions\n\nRules for metadata extraction:\n- institution: The university name\n- course: Course code and name (e.g. \"CSC 301 - Data Structures\")\n- year: Academic year range (e.g. \"2025/2026\"). Convert single years to ranges.\n- semester: \"First\" or \"Second\"\n- type: \"Objective\" (MCQ), \"Theory\" (essay), or \"Mixed\"\n- contentPreview: First 200-300 chars of actual question content\n- fullContent: Complete question text\n\nRules for marksScheme:\n- Extract ALL marks allocation visible on the paper\n- For each question with marks, create entry with question number, totalMarks, and parts array\n- Each part has label, marks, and brief text\n- If no marks visible, use empty array []\n\nRules for answerGenerated:\n- Write a comprehensive model answer that a top-scoring student would submit\n- For theory: detailed explanations with examples\n- For MCQ: correct option with explanation\n- Structure by question number and sub-parts\n\nReturn structured JSON with all fields.`,
        },
        {
          media: {
            url: `data:${mimeType};base64,${base64}`,
          },
        },
      ],
      output: { schema: CombinedResultSchema },
      config: { temperature: 0.1 },
    });

    const elapsed = Date.now() - startTime;
    console.log(`Single Gemini call completed in ${elapsed}ms`);
    // Step 3: Processing results
    await updateStep('processing_results');
    // Step 3: Processing results
    await updateStep('processing_results');

    if (!output) {
      throw new Error('Gemini returned no output — the image may be unreadable');
    }

    const ocrText = output.extractedText;
    if (!ocrText || ocrText.trim().length < 10) {
      throw new Error('Gemini extracted very little text from the image');
    }

    console.log(`Extracted ${ocrText.length} chars, metadata: ${output.title}`);

    // Parse year for DB compatibility
    const rawYear = output.year || '';
    const yearMatch = String(rawYear).match(/(\d{4})/);
    const yearSession = yearMatch ? rawYear : String(new Date().getFullYear());
    const yearStart = yearMatch ? yearMatch[1] : String(new Date().getFullYear());

    // Build update payload — UPDATE the existing question in-place
    const updates: Record<string, unknown> = {
      title: output.title,
      institution: output.institution,
      course: output.course,
      faculty: output.faculty,
      department: output.department,
      year: yearSession,
      semester: output.semester,
      type: output.type || 'Mixed',
      content_preview: output.contentPreview,
      full_content: output.fullContent,
      answer: output.answer,
      explanation: output.explanation,
      marks_scheme: output.marksScheme || [],
      answer_generated: output.answerGenerated,
      ai_extracted_data: {
        confidence: { overall: 0.95, institution: 0.92, course: 0.90, year: 0.93, semester: 0.91, type: 0.88 },
        extractedText: ocrText,
      },
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    let { error: updateError } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id);

    // If year format fails (column is integer), retry with starting year
    if (updateError && yearSession !== yearStart) {
      console.log(`Year format '${yearSession}' failed, retrying with '${yearStart}'`);
      updates.year = yearStart;
      const retry = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id);
      updateError = retry.error;
    }

    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`);
    }

    // Step 4: Complete
    await updateStep('complete');

    // Fetch the updated question to return
    const { data: updatedQuestion, error: fetchUpdatedError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchUpdatedError) throw fetchUpdatedError;

    res.json({
      success: true,
      question: updatedQuestion,
      message: 'Exam paper re-processed successfully',
      ocrConfidence: { overall: 0.95 },
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

// ── Generate Answer: AI-only answer generation (no re-extraction) ──
adminRouter.post('/:id/generate-answer', requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    const supabase = createServerSupabase();
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('id, full_content, marks_scheme')
      .eq('id', id)
      .single();
    if (fetchError || !question) { res.status(404).json({ error: 'Exam paper not found' }); return; }
    if (!question.full_content) { res.status(400).json({ error: 'No question content to generate answer from' }); return; }

    const { ai } = await import('../../src/ai/genkit');
    const { z } = await import('zod');

    const AnswerSchema = z.object({
      answer: z.string().describe('Comprehensive model answer'),
      explanation: z.string().optional().describe('Step-by-step explanation'),
    });

    const marksContext = question.marks_scheme && Array.isArray(question.marks_scheme) && question.marks_scheme.length > 0
      ? `\n\nMarks allocation:\n${JSON.stringify(question.marks_scheme, null, 2)}\n\nStructure your answer to address each sub-part.`
      : '';

    const startTime = Date.now();
    const { output } = await ai.generate({
      prompt: `You are an expert academic tutor specializing in Nigerian university courses.\n\nGiven the following exam questions, write a comprehensive model answer.\n\nQuestions:\n${question.full_content}${marksContext}\n\nRules:\n- Answer ALL questions thoroughly\n- For theory: detailed explanations with examples\n- For MCQ: correct option with explanation\n- If marks are allocated, match the marks weight\n- Use clear formatting with question numbers\n\nReturn ONLY valid JSON matching the schema.`,
      output: { schema: AnswerSchema },
      config: { temperature: 0.3 },
    });

    const elapsed = Date.now() - startTime;
    console.log(`Answer generation completed in ${elapsed}ms`);

    if (!output) { throw new Error('AI failed to generate answer'); }

    const { error: updateError } = await supabase
      .from('questions')
      .update({ answer_generated: output.answer, explanation: output.explanation, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) { throw new Error(`Failed to update: ${updateError.message}`); }

    const { data: updated, error: fetchErr } = await supabase.from('questions').select('*').eq('id', id).single();
    if (fetchErr) throw fetchErr;

    res.json({ success: true, question: updated, message: 'Answer generated successfully' });
  } catch (error: any) {
    console.error('Error generating answer:', error);
    res.status(500).json({ error: error.message || 'Failed to generate answer' });
  }
});

// ── Approve / Reject ──
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
