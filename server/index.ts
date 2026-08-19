/**
 * Standalone Express server — used for local dev and self-hosted production.
 * For Vercel, see api/server.ts instead.
 */
import app from './app';

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || (isProd ? 9002 : 9001);

app.listen(PORT, () => {
  console.log(`[jackpass-api] listening on http://localhost:${PORT}`);
});
