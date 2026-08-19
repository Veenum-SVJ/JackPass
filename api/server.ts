/**
 * Vercel serverless entry point — wraps the Express app for serverless execution.
 *
 * Vercel invokes this as a single serverless function for all /api/* routes.
 * In dev, use `npm run dev` (Express runs directly on port 9001).
 */
import app from '../server/app';

// Vercel expects either:
// - A default export of a handler function (req, res) => void
// - Or an Express app (which IS a handler function)
export default app;
