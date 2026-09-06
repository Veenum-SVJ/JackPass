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
 * Verify a file's magic bytes match its declared MIME type. The browser-set
 * mimetype alone must never be trusted (it is just a field in the request).
 */
function sniffMime(file: Express.Multer.File): string | null {
  const head = file.buffer.subarray(0, 12);
  if (head.length === 0) return null;
  if (head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) {
    return 'application/pdf';
  }
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return 'image/png';
  }
  return null;
}

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

    // Validate declared type, size, and actual file content
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
      const sniffed = sniffMime(file);
      if (sniffed === null) {
        res.status(400).json({ error: `File ${file.originalname} is empty or is not a valid PDF/JPEG/PNG` });
        return;
      }
      if (sniffed !== file.mimetype) {
        res.status(400).json({ error: `File ${file.originalname} content does not match its declared type` });
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
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

/**
 * GET /api/upload?id=...
 * Check the status of an upload. Scoped to the caller — an upload id alone
 * never grants access to another user's record.
 */
uploadRouter.get('/', requireAuth, async (req, res) => {
  try {
    const uploadId = typeof req.query.id === 'string' ? req.query.id : undefined;
    if (!uploadId) {
      res.status(400).json({ error: 'Upload ID is required' });
      return;
    }

    const user = res.locals.user as { id: string };
    const uploadRecord = await getUploadStatus(uploadId, user.id);
    if (!uploadRecord) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }
    res.json({ success: true, upload: uploadRecord });
  } catch (error: any) {
    console.error('Upload status error:', error);
    res.status(500).json({ error: 'Could not load upload status' });
  }
});
