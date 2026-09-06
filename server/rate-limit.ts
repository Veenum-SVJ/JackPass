/**
 * Rate limiting for the JackPass API.
 *
 * Express apps only see the real client IP when running behind a proxy
 * (Vercel sets x-forwarded-for). Enable `trust proxy` once in each entry
 * point before mounting these limiters (see server/http-hardening.ts).
 *
 * Limits are deliberately tiered by cost/sensitivity and documented below.
 * Note: on Vercel serverless the in-memory store is per warm instance, so
 * these limits are a per-instance ceiling, not a global one. Raise/lower
 * here, not in route code.
 *
 * ── Windows ─────────────────────────────────────────────────────────────
 *  api         600 req / 15 min / IP            — global safety net on /api
 *  events      240 req / 15 min / IP            — page-view/action tracking
 *  questions   300 req / 15 min / IP            — public question lists
 *  upload      60  req / 15 min / IP+token      — file uploads + status polls
 *  payments    30  req / 15 min / IP+token      — initiate/verify
 *  ai          20  req /  1 hour / IP+token     — expensive Gemini calls
 *  writes      30  req / 15 min / IP+token      — forum/feedback creation
 *  votes       60  req / 15 min / IP+token      — forum/feedback voting
 */
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import crypto from 'node:crypto';
import type { Request } from 'express';

/** Stable-ish key: the proxied client IP. */
function ipKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Key that also folds in the caller's bearer token (hashed, never stored).
 * An attacker rotating IPs still shares a key as long as they reuse a token;
 * a user with no token falls back to the IP key.
 */
function ipAuthKey(req: Request): string {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) return ipKey(req);
  const digest = crypto.createHash('sha1').update(auth).digest('hex').slice(0, 16);
  return `${ipKey(req)}:${digest}`;
}

const base = {
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false,
  handler: (_req: Request, res: any) => {
    res.status(429).json({
      error: 'Too many requests. Please slow down and try again later.',
    });
  },
} as const;

export const apiLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 600,
  keyGenerator: ipKey,
});

export const eventsLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 240,
  keyGenerator: ipKey,
});

export const questionsLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 300,
  keyGenerator: ipKey,
});

export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 60,
  keyGenerator: ipAuthKey,
});

export const paymentsLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 30,
  keyGenerator: ipAuthKey,
});

export const aiLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 60 * 60_000,
  limit: 20,
  keyGenerator: ipAuthKey,
});

export const writeLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 30,
  keyGenerator: ipAuthKey,
});

export const voteLimiter: RateLimitRequestHandler = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 60,
  keyGenerator: ipAuthKey,
});
