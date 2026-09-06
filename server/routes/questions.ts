import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { mapQuestionRow, type QuestionRow } from '../../src/lib/mappers';

export const questionsRouter = Router();

/**
 * Lightweight columns for LIST responses. Full bodies (full_content,
 * answers, marks schemes, AI payloads) are only served by the detail
 * endpoint, so browsing stays fast and the wire stays lean.
 */
const LIST_SELECT =
  'id, title, institution, course, faculty, department, year, semester, type, status, content_preview, file_name, file_type, lecturer_id, created_at, updated_at';

/**
 * GET /api/questions
 * List approved questions, optionally filtered.
 */
questionsRouter.get('/', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    let query = supabase
      .from('questions')
      .select(LIST_SELECT)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const { institution, course, year, semester, type } = req.query;

    if (typeof institution === 'string' && institution) {
      query = query.eq('institution', institution);
    }
    if (typeof course === 'string' && course) {
      query = query.ilike('course', `%${course}%`);
    }
    if (typeof year === 'string' && year) {
      query = query.eq('year', Number(year));
    }
    if (typeof semester === 'string' && semester) {
      query = query.eq('semester', semester);
    }
    if (typeof type === 'string' && type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    res.json((data ?? []).map((row: any) => mapQuestionRow(row as unknown as QuestionRow)));
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

/**
 * GET /api/questions/:id
 * Fetch a single question by id.
 */
questionsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Invalid uuid format or similar — treat as not found rather than 500
      if (error.code === '22P02') {
        res.status(404).json({ error: 'Question not found' });
        return;
      }
      throw error;
    }

    if (!data) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const question = mapQuestionRow(data as QuestionRow);

    // If the question has a lecturer, attach their profile summary
    if (data.lecturer_id) {
      const { data: lecturer } = await supabase
        .from('lecturers')
        .select('id, name, institution, department, rating_avg, review_count, photo_url')
        .eq('id', data.lecturer_id)
        .single();

      if (lecturer) {
        (question as any).lecturer = lecturer;
      }
    }

    res.json(question);
  } catch (error) {
    console.error(`Failed to fetch question ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
