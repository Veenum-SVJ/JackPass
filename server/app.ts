/**
 * Shared Express application — used by both:
 *   1. `api/server.ts` (Vercel serverless function)
 *   2. `server/index.ts` (standalone Express server for local dev)
 */
import './load-env';

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { questionsRouter } from './routes/questions';
import { adminRouter } from './routes/admin';
import { uploadRouter } from './routes/upload';
import { paymentsRouter } from './routes/payments';
import { usersRouter } from './routes/users';
import { subscriptionRouter } from './routes/subscription';
import { aiRouter } from './routes/ai';
import { lecturersRouter } from './routes/lecturers';
import { lecturerReviewsRouter } from './routes/lecturer-reviews';
import { lecturerFlagsRouter } from './routes/lecturer-flags';
import { lecturerPhotosRouter } from './routes/lecturer-photos';

const app = express();
app.disable('x-powered-by');

// Parse JSON bodies for API routes (limit raised for base64 data URIs).
// The Paystack webhook must receive the RAW body so its HMAC signature can be verified.
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    express.raw({ type: '*/*' })(req, res, next);
  } else {
    express.json({ limit: '25mb' })(req, res, next);
  }
});

// ── API routes ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'jackpass-api', time: new Date().toISOString() });
});
app.use('/api/questions', questionsRouter);
app.use('/api/admin/questions', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/user/subscription', subscriptionRouter);
app.use('/api/ai', aiRouter);
app.use('/api/lecturers', lecturersRouter);
app.use('/api/lecturer-reviews', lecturerReviewsRouter);
app.use('/api/lecturer-flags', lecturerFlagsRouter);
app.use('/api/lecturer-photos', lecturerPhotosRouter);

// ── Static SPA (production) ───────────────────────────────────────────────────
// In Vercel, the SPA is served from dist/ by the static hosting layer.
// For standalone mode (local production), Express serves it.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const servingStatic = fs.existsSync(distDir);
if (servingStatic) {
  app.use(express.static(distDir));
  // SPA fallback — serve index.html for any non-API path
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ── 404 for unmatched API routes ─────────────────────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
