import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { buildSummary } from '../../src/lib/analytics-summary';
import { renderDigestHtml, renderDigestText } from '../../src/lib/digest-email';
import { requireAdmin } from '../middleware';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://jackpass-vite.vercel.app').replace(/\/$/, '');
}

/** Cover the trailing 7 days (inclusive of today). */
function weekWindow() {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  return { start, end, days: 7 };
}

export function subjectFor(start: string, end: string): string {
  return `JackPass weekly digest — ${start} to ${end}`;
}

interface SendArgs {
  to: string[];
  start: string;
  end: string;
  days: number;
}

/** Build + send the digest; returns the Resend id. */
export async function sendDigest({ to, start, end, days }: SendArgs): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');

  const summary = await buildSummary(createServerSupabase(), days);
  const payload = { summary, rangeStart: start, rangeEnd: end, appUrl: appUrl() };

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.DIGEST_FROM_EMAIL || 'JackPass <digest@jackpass.app>',
      to,
      subject: subjectFor(start, end),
      html: renderDigestHtml(payload),
      text: renderDigestText(payload),
    }),
  });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof body === 'object' && body !== null ? JSON.stringify(body) : '';
    throw new Error(`Resend failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const id = (body as { id?: string })?.id ?? 'unknown';
  console.log(`Digest email sent to ${to.length} recipient(s), id=${id}, window=${start}..${end}`);
  return id;
}

export const cronRouter = Router();

/**
 * POST /api/cron/weekly-digest — Vercel Cron (weekly, Monday 08:00 UTC).
 * Auth: `Authorization: Bearer ${CRON_SECRET}`. Sends to every admin email
 * (is_admin profiles, via the auth admin API); logs to digest_sends to
 * prevent duplicate sends if the cron fires twice in one window.
 */
cronRouter.post('/weekly-digest', async (req, res) => {
  const auth = req.headers.authorization || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const supabase = createServerSupabase();
    const { start, end, days } = weekWindow();
    const weekKey = `${start}_${end}`;

    // Idempotence: skip if this window was already sent.
    const { data: existing } = await supabase
      .from('digest_sends')
      .select('id')
      .eq('week_key', weekKey)
      .maybeSingle();
    if (existing) {
      res.json({ ok: true, skipped: true, reason: 'already sent', weekKey });
      return;
    }

    // Recipients: every admin profile's email via the auth admin API.
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('is_admin', true);
    const adminIds = (profiles ?? []).map((p: { id: string }) => p.id);

    const to: string[] = [];
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 500 });
    for (const u of usersList?.users ?? []) {
      if (adminIds.includes(u.id) && u.email) to.push(u.email);
    }
    if (to.length === 0) {
      res.json({ ok: true, skipped: true, reason: 'no admin recipients' });
      return;
    }

    const resendId = await sendDigest({ to, start, end, days });

    await supabase
      .from('digest_sends')
      .insert({ week_key: weekKey, recipients: to.length, resend_id: resendId });

    res.json({ ok: true, sent: to.length, weekKey });
  } catch (error: any) {
    console.error('Weekly digest failed:', error);
    res.status(500).json({ error: error.message || 'Digest failed' });
  }
});

/** POST /api/admin/digest/send?days=7&to=admin@example.com — test send (admin only). */
export const adminDigestRouter = Router();
adminDigestRouter.use(requireAdmin);

adminDigestRouter.post('/send', async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
    const toParam = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const start = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);
    const to = toParam ? [toParam] : [res.locals.user?.email || ''].filter(Boolean);

    if (to.length === 0) {
      res.status(400).json({ error: 'No recipient email available' });
      return;
    }

    const resendId = await sendDigest({ to, start, end, days });
    res.json({ ok: true, to, window: { start, end }, resendId });
  } catch (error: any) {
    console.error('Digest test send failed:', error);
    res.status(500).json({ error: error.message || 'Digest send failed' });
  }
});
