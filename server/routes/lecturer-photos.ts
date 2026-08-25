import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware';
import { createServerSupabase } from '../../src/lib/supabase-server';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const lecturerPhotosRouter = Router();

// ── LIST photos for a lecturer ───────────────────────────────────────────
lecturerPhotosRouter.get('/lecturer/:lecturerId', async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { lecturerId } = req.params;

    const { data, error } = await supabase
      .from('lecturer_photos')
      .select('*, user:user_id(name, avatar)')
      .eq('lecturer_id', lecturerId)
      .order('is_primary', { ascending: false })
      .order('upvotes', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// ── UPLOAD a photo (authenticated) ───────────────────────────────────────
lecturerPhotosRouter.post(
  '/',
  requireAuth,
  upload.single('photo'),
  async (req, res) => {
    try {
      const supabase = createServerSupabase();
      const user = res.locals.user as { id: string };

      const { lecturer_id, caption, photo_url } = req.body;

      if (!lecturer_id) {
        res.status(400).json({ error: 'lecturer_id is required' });
        return;
      }

      let finalUrl = photo_url;

      // If a file was uploaded, store it in Supabase Storage
      if (req.file && !photo_url) {
        const ext = req.file.originalname.split('.').pop() || 'jpg';
        const storagePath = `lecturer-photos/${lecturer_id}/${user.id}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('question-files') // reuse existing bucket
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('question-files')
          .getPublicUrl(storagePath);

        finalUrl = urlData.publicUrl;
      }

      if (!finalUrl) {
        res.status(400).json({ error: 'Either photo file or photo_url is required' });
        return;
      }

      const { data, error } = await supabase
        .from('lecturer_photos')
        .insert([{
          lecturer_id,
          user_id: user.id,
          photo_url: finalUrl,
          caption: caption || '',
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: error.message || 'Failed to upload photo' });
    }
  }
);

// ── DELETE a photo (uploader only) ───────────────────────────────────────
lecturerPhotosRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const user = res.locals.user as { id: string };
    const { id } = req.params;

    const { error } = await supabase
      .from('lecturer_photos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// ── VOTE on a photo (upvote) ─────────────────────────────────────────────
lecturerPhotosRouter.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const supabase = createServerSupabase();
    const { id } = req.params;

    // Simple increment — a real app would track per-user votes
    const { error } = await supabase.rpc('increment_photo_upvotes', { photo_id: id });
    if (error) {
      // Fallback: manual update
      const { data: photo } = await supabase
        .from('lecturer_photos')
        .select('upvotes')
        .eq('id', id)
        .single();

      if (photo) {
        await supabase
          .from('lecturer_photos')
          .update({ upvotes: (photo.upvotes || 0) + 1 })
          .eq('id', id);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error upvoting photo:', error);
    res.status(500).json({ error: 'Failed to upvote photo' });
  }
});
