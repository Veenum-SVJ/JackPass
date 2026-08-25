/**
 * Debug: try importing from ../server/routes to test Vercel import resolution.
 */
import express from 'express';

const app = express();

app.get('/api/debug', async (_req, res) => {
  try {
    const mod = await import('../server/routes/questions');
    res.json({ ok: true, hasRouter: !!mod.questionsRouter });
  } catch (err: any) {
    res.json({ ok: false, error: err.message, code: err.code, stack: err.stack?.substring(0, 500) });
  }
});

export default app;
