/**
 * Vercel serverless entry point — self-contained Express app.
 *
 * Vercel invokes this as a single serverless function for all /api/* routes.
 * In dev, use `npm run dev` (Express runs directly on port 9001).
 *
 * NOTE: This file inlines the Express app setup because Vercel's serverless
 * runtime cannot resolve imports outside the api/ directory (e.g. ../server/app).
 */
import './load-env';

import express from 'express';

import { questionsRouter } from '../server/routes/questions';
import { adminRouter } from '../server/routes/admin';
import { uploadRouter } from '../server/routes/upload';
import { paymentsRouter } from '../server/routes/payments';
import { usersRouter } from '../server/routes/users';
import { subscriptionRouter } from '../server/routes/subscription';
import { aiRouter } from '../server/routes/ai';
import { lecturersRouter } from '../server/routes/lecturers';
import { lecturerReviewsRouter } from '../server/routes/lecturer-reviews';
import { lecturerFlagsRouter } from '../server/routes/lecturer-flags';
import { lecturerPhotosRouter } from '../server/routes/lecturer-photos';

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

// 404 for unmatched API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
