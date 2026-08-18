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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

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

// ── Static SPA (production) ───────────────────────────────────────────────────
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

// ── Start ────────────────────────────────────────────────────────────────────
// Dev: default 9001 (Vite proxies /api here). Production: default 9002 (or $PORT).
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || (isProd ? 9002 : 9001);

app.listen(PORT, () => {
  console.log(`[jackpass-api] listening on http://localhost:${PORT}`);
  if (servingStatic) {
    console.log(`[jackpass-api] serving static app from ${distDir}`);
  } else {
    console.log('[jackpass-api] dev mode — waiting for Vite dev server (http://localhost:9003)');
  }
});
