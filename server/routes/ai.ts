import { Router } from 'express';
import { z } from 'zod';
import { processQuestionDocument } from '../../src/ai/flows/process-question-document';
import { requireAuth } from '../middleware';
import { aiLimiter } from '../rate-limit';

export const aiRouter = Router();

/**
 * The document scanner only ever reads from two sources:
 *  - public Google Drive links (drive.google.com/...)
 *  - inline data URIs for images/PDFs the browser just scanned
 * Restricting the scheme+host keeps this endpoint from being used as a
 * generic server-side URL fetcher (SSRF) and caps payload size.
 */
function isAllowedSource(fileUrl: string): boolean {
  if (fileUrl.startsWith('data:image/jpeg') || fileUrl.startsWith('data:image/png') || fileUrl.startsWith('data:application/pdf')) {
    // Cap encoded payload (~12 MB raw) to protect the Gemini request budget.
    return fileUrl.length <= 20_000_000;
  }
  try {
    const url = new URL(fileUrl);
    return url.protocol === 'https:' && url.hostname === 'drive.google.com';
  } catch {
    return false;
  }
}

const ProcessDocumentBody = z.object({
  fileUrl: z.string().min(1, 'fileUrl is required').max(20_000_000),
});

/**
 * POST /api/ai/process-document
 * Run the Genkit image-scanning flow server-side (Gemini — metered).
 * Authenticated + rate limited (20/hour/user+IP by default).
 */
aiRouter.post('/process-document', requireAuth, aiLimiter, async (req, res) => {
  try {
    const parsed = ProcessDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' });
      return;
    }

    const { fileUrl } = parsed.data;

    if (!isAllowedSource(fileUrl)) {
      res.status(400).json({ error: 'Only Google Drive links or pasted image data are supported' });
      return;
    }

    const result = await processQuestionDocument({ fileUrl });

    res.json(result);
  } catch (error: any) {
    console.error('AI document processing error:', error);
    res.status(500).json({ error: 'Document processing failed' });
  }
});
