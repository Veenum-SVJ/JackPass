import { Router } from 'express';
import { mapQuestionRow, type QuestionRow } from '../../src/lib/mappers';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { getBearerToken, getUserFromRequest } from '../middleware';

export const usersRouter = Router();

/**
 * GET /api/users/:userId/uploads
 * Fetch questions uploaded by a specific user.
 *
 * Visibility: the uploader (when authenticated as them) sees all of their
 * uploads including pending/rejected; everyone else only ever sees
 * approved questions — pending drafts must not leak before moderation.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

usersRouter.get('/:userId/uploads', async (req, res) => {
  const { userId } = req.params;

  try {
    if (!UUID_REGEX.test(userId)) {
      res.json([]);
      return;
    }

    // Identify the caller (optional) — never trusts a client-supplied id.
    let requesterId: string | null = null;
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user) requesterId = user.id;
    }
    const isOwner = requesterId !== null && requesterId === userId;

    const supabase = createServerSupabase();

    let data: any[] = [];
    let error: { message: string } | null = null;
    if (isOwner) {
      const result = await supabase
        .from('questions')
        .select('*')
        .eq('uploader_id', userId)
        .order('created_at', { ascending: false });
      data = (result.data as any[]) ?? [];
      error = result.error;
    } else {
      const result = await supabase
        .from('questions')
        .select(
          'id, title, institution, course, faculty, department, year, semester, type, status, content_preview, file_name, file_type, lecturer_id, created_at, updated_at'
        )
        .eq('uploader_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      data = (result.data as any[]) ?? [];
      error = result.error;
    }

    if (error) {
      console.error(`Failed to fetch uploads for user ${userId}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(data.map((row: any) => mapQuestionRow(row as unknown as QuestionRow)));
  } catch (error) {
    console.error(`Failed to fetch uploads for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
