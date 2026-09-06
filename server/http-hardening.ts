/**
 * Transport/response hardening shared by both entry points
 * (server/app.ts for local dev + api/_server.ts for Vercel).
 */
import type { Express, NextFunction, Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

/**
 * Trust the first proxy hop so req.ip reflects the real client behind
 * Vercel's edge. Only enabled in production-ish environments — in local
 * dev a direct connection means no proxy to trust.
 */
export function setTrustProxy(app: Express): void {
  if (isProd) app.set('trust proxy', 1);
}

/** Conservative, safe security headers (no CSP — see README/notes). */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

/**
 * Last-resort JSON error handler. Keeps stack traces and provider error
 * details out of HTTP responses; they still reach the server logs via
 * the console.error below.
 */
export function jsonErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) return;

  // Body-parser: payload too large (global JSON limit is 25 MB)
  if (err && err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body too large' });
    return;
  }
  // Multer upload errors → client-correctable 4xx, not 500
  if (err && err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 10 MB size limit'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files (maximum of 10)'
          : 'Upload failed';
    res.status(400).json({ error: message });
    return;
  }

  console.error('Unhandled server error:', err);
  res.status(err && typeof err.status === 'number' ? err.status : 500).json({
    error: 'Internal server error',
  });
}
