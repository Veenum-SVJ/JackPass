import { Router } from 'express';
import { mapQuestionRow, type QuestionRow } from '../../src/lib/mappers';
import { createServerSupabase } from '../../src/lib/supabase-server';

export const usersRouter = Router();

/**
 * GET /api/users/:userId/uploads
 * Fetch questions uploaded by a specific user.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

usersRouter.get('/:userId/uploads', async (req, res) => {
  const { userId } = req.params;

  try {
    if (!UUID_REGEX.test(userId)) {
      res.json([]);
      return;
    }

    const { data, error } = await createServerSupabase()
      .from('questions')
      .select('*')
      .eq('uploader_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Failed to fetch uploads for user ${userId}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json((data ?? []).map((row) => mapQuestionRow(row as QuestionRow)));
  } catch (error) {
    console.error(`Failed to fetch uploads for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
