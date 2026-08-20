import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware';
import { processQuestionUpload, processLinkImport, getUploadStatus } from '@/lib/upload';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10,
  },
});

export const uploadRouter = Router();

/**
 * POST /api/upload
 * Upload question file(s) or import from a link → Supabase Storage → async OCR + AI processing.
 */
uploadRouter.post('/', requireAuth, upload.any(), async (req, res) => {
  try {
    const user = res.locals.user as { id: string };

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const file = files[0];
    const fileUrl = typeof req.body.fileUrl === 'string' ? req.body.fileUrl : undefined;

    const title = typeof req.body.title === 'string' ? req.body.title : undefined;
    const institution = typeof req.body.institution === 'string' ? req.body.institution : undefined;
    const course = typeof req.body.course === 'string' ? req.body.course : undefined;
    const courseCode = typeof req.body.courseCode === 'string' ? req.body.courseCode : undefined;
    const yearRaw = typeof req.body.year === 'string' ? req.body.year.trim() : undefined;
    const semester = req.body.semester as 'First' | 'Second' | undefined;
    const type = req.body.type as 'Objective' | 'Theory' | 'Mixed' | undefined;

    // Handle link import (no file attached)
    if (fileUrl && !file) {
      const result = await processLinkImport(fileUrl, user.id, {
        title,
        institution,
        course: course || undefined,
        courseCode: courseCode || undefined,
        year: yearRaw || undefined,
        semester: semester || undefined,
        type: type || undefined,
      });

      res.json({
        success: true,
        uploadId: result.upload.id,
        fileUrl: result.fileUrl,
        ocrText: result.ocrText,
        message: 'Link imported and processed successfully',
      });
      return;
    }

    if (!file) {
      res.status(400).json({ error: 'No file or link provided' });
      return;
    }

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({ error: 'Invalid file type. Only PDF and image files are allowed.' });
      return;
    }

    if (file.size > maxSize) {
      res.status(400).json({ error: 'File size exceeds 10 MB limit' });
      return;
    }

    // Convert the uploaded buffer into a Node File so the shared upload lib can process it
    const nodeFile = new File([file.buffer as unknown as ArrayBuffer], file.originalname, { type: file.mimetype });

    const result = await processQuestionUpload(nodeFile, user.id, {
      title,
      institution,
      course: course || undefined,
      courseCode: courseCode || undefined,
      year: yearRaw || undefined,
      semester: semester || undefined,
      type: type || undefined,
    });

    res.json({
      success: true,
      uploadId: result.upload.id,
      fileUrl: result.fileUrl,
      ocrText: result.ocrText,
      message: 'File uploaded and processed successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/upload?id=...
 * Check the status of an upload.
 */
uploadRouter.get('/', requireAuth, async (req, res) => {
  try {
    const uploadId = typeof req.query.id === 'string' ? req.query.id : undefined;
    if (!uploadId) {
      res.status(400).json({ error: 'Upload ID is required' });
      return;
    }

    const uploadRecord = await getUploadStatus(uploadId);
    res.json({ success: true, upload: uploadRecord });
  } catch (error: any) {
    console.error('Upload status error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
