import { Router } from 'express';
import { requireAuth } from '../middleware';
import { createServerSupabase } from '../../src/lib/supabase-server';

export const lecturersRouter = Router();

// ── LIST lecturers (with search) ─────────────────────────────────────────
lecturersRouter.get('/', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { institution, q } = req.query;

    let query = supabase
      .from('lecturers')
      .select('*')
      .order('rating_avg', { ascending: false });

    if (typeof institution === 'string' && institution) {
      query = query.eq('institution', institution);
    }
    if (typeof q === 'string' && q) {
      query = query.or(`name.ilike.%${q}%,department.ilike.%${q}%`);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    res.json(data ?? []);
  } catch (error) {
    console.error('Error listing lecturers:', error);
    res.status(500).json({ error: 'Failed to fetch lecturers' });
  }
});

// ── GET lecturer by id ───────────────────────────────────────────────────
lecturersRouter.get('/:id', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lecturers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      res.status(404).json({ error: 'Lecturer not found' });
      return;
    }
    if (error) throw error;

    // Also fetch their courses and question count
    const { data: courses } = await supabase
      .from('questions')
      .select('course, institution')
      .eq('lecturer_id', id)
      .eq('status', 'approved');

    const uniqueCourses = [...new Set((courses ?? []).map((c) => c.course))];
    const uniqueInstitutions = [...new Set((courses ?? []).map((c) => c.institution))];

    res.json({
      ...data,
      courses: uniqueCourses,
      institutions: uniqueInstitutions,
      questionCount: courses?.length ?? 0,
    });
  } catch (error) {
    console.error('Error fetching lecturer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── CREATE lecturer (authenticated) ──────────────────────────────────────
lecturersRouter.post('/', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();

    const { name, institution, faculty, department, country, photo_url, teaching_style, known_for } = req.body;

    if (!name || !institution) {
      res.status(400).json({ error: 'name and institution are required' });
      return;
    }

    const { data, error } = await supabase
      .from('lecturers')
      .insert([{
        name,
        institution,
        faculty: faculty || null,
        department: department || null,
        country: country || null,
        photo_url: photo_url || null,
        teaching_style: teaching_style || [],
        known_for: known_for || '',
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating lecturer:', error);
    res.status(500).json({ error: error.message || 'Failed to create lecturer' });
  }
});

// ── UPDATE lecturer (authenticated — attribution tracked) ─────────────────
lecturersRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;

    const { name, institution, faculty, department, country, photo_url, teaching_style, known_for } = req.body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (institution !== undefined) updates.institution = institution;
    if (faculty !== undefined) updates.faculty = faculty;
    if (department !== undefined) updates.department = department;
    if (country !== undefined) updates.country = country;
    if (photo_url !== undefined) updates.photo_url = photo_url;
    if (teaching_style !== undefined) updates.teaching_style = teaching_style;
    if (known_for !== undefined) updates.known_for = known_for;

    const { data, error } = await supabase
      .from('lecturers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error updating lecturer:', error);
    res.status(500).json({ error: error.message || 'Failed to update lecturer' });
  }
});

// ── GET questions set by this lecturer ────────────────────────────────────
lecturersRouter.get('/:id/questions', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('lecturer_id', id)
      .eq('status', 'approved')
      .order('year', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error('Error fetching lecturer questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});
