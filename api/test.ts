/**
 * Minimal test endpoint to verify Vercel serverless functions work.
 */
export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'ok', message: 'Vercel serverless function works!' });
}
