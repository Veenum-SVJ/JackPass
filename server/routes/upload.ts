import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware';
import { processQuestionUploadMulti, processLinkImport, getUploadStatus } from '../../src/lib/upload';

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

    const allFiles = (req.files as Express.Multer.File[] | undefined) ?? [];
    const fileUrl = typeof req.body.fileUrl === 'string' ? req.body.fileUrl : undefined;

    const title = typeof req.body.title === 'string' ? req.body.title : undefined;
    const institution = typeof req.body.institution === 'string' ? req.body.institution : undefined;
    const course = typeof req.body.course === 'string' ? req.body.course : undefined;
    const courseCode = typeof req.body.courseCode === 'string' ? req.body.courseCode : undefined;
    const yearRaw = typeof req.body.year === 'string' ? req.body.year.trim() : undefined;
    const semester = req.body.semester as 'First' | 'Second' | undefined;
    const type = req.body.type as 'Objective' | 'Theory' | 'Mixed' | undefined;

    const metadata = {
      title,
      institution,
      course: course || undefined,
      courseCode: courseCode || undefined,
      year: yearRaw || undefined,
      semester: semester || undefined,
      type: type || undefined,
    };

    // Handle link import (no file attached)
    if (fileUrl && allFiles.length === 0) {
      const result = await processLinkImport(fileUrl, user.id, metadata);

      res.json({
        success: true,
        uploadId: result.upload.id,
        fileUrl: result.fileUrl,
        ocrText: result.ocrText,
        message: 'Link imported and processed successfully',
      });
      return;
    }

    if (allFiles.length === 0) {
      res.status(400).json({ error: 'No file or link provided' });
      return;
    }

    // Validate file types and sizes
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    for (const file of allFiles) {
      if (!allowedTypes.includes(file.mimetype)) {
        res.status(400).json({ error: `Invalid file type for ${file.originalname}. Only PDF and image files are allowed.` });
        return;
      }
      if (file.size > maxSize) {
        res.status(400).json({ error: `File ${file.originalname} exceeds 10 MB limit` });
        return;
      }
    }

    // Convert all uploaded buffers into Node Files
    const nodeFiles = allFiles.map(f =>
      new File([f.buffer as unknown as ArrayBuffer], f.originalname, { type: f.mimetype })
    );

    // Multi-page: process ALL files, combine OCR text, create ONE question
    const result = await processQuestionUploadMulti(nodeFiles, user.id, metadata);

    res.json({
      success: true,
      uploadId: result.uploadId,
      fileUrl: result.fileUrl,
      pageCount: result.pageCount,
      message: result.pageCount > 1
        ? `${result.pageCount}-page question paper uploaded and processed successfully`
        : 'File uploaded and processed successfully',
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
