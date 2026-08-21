import { Router } from 'express';
import { z } from 'zod';
import { processQuestionDocument } from '@/ai/flows/process-question-document';

export const aiRouter = Router();

const ProcessDocumentBody = z.object({
  fileUrl: z.string().min(1, 'fileUrl is required'),
});

/**
 * POST /api/ai/process-document
 * Run the Genkit image-scanning flow server-side.
 * Accepts either a public Google Drive URL or a base64 data URI.
 */
aiRouter.post('/process-document', async (req, res) => {
  try {
    const parsed = ProcessDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
      return;
    }

    const { fileUrl } = parsed.data;

    const result = await processQuestionDocument({ fileUrl });

    res.json(result);
  } catch (error: any) {
    console.error('AI document processing error:', error);
    res.status(500).json({ error: error.message || 'Document processing failed' });
  }
});
