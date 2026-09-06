import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { getBearerToken, getUserFromRequest, requireAdmin } from '../middleware';

/**
 * POST /api/events
 * Open, fire-and-forget usage tracking. Attaches the user id when a valid
 * session token is present; never fails the client on errors.
 * (Mounted at /api/events in both server/app.ts and api/_server.ts, so the
 * route itself is "/" — a nested "/events" here would double the path.)
 */
export const analyticsRouter = Router();

analyticsRouter.post('/', async (req, res) => {
  try {
    const { sessionId, eventName, page, metadata, durationSeconds } = req.body ?? {};

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 64) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }
    if (!eventName || typeof eventName !== 'string' || eventName.length > 64) {
      res.status(400).json({ error: 'eventName is required' });
      return;
    }

    // Optional auth — attach user_id if a valid token is supplied.
    let userId: string | null = null;
    if (getBearerToken(req)) {
      const user = await getUserFromRequest(req);
      if (user) userId = user.id;
    }

    const supabase = createServerSupabase();
    const now = new Date().toISOString();
    const isPageView = eventName === 'page_view';
    const duration =
      typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)
        ? Math.max(0, Math.round(durationSeconds))
        : null;

    // Upsert session
    const { data: existing } = await supabase
      .from('sessions')
      .select('id, page_views')
      .eq('id', sessionId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('sessions').insert({
        id: sessionId,
        user_id: userId,
        started_at: now,
        last_seen_at: now,
        user_agent: String(req.headers['user-agent'] || '').slice(0, 300) || null,
        referrer: String(req.headers.referer || '').slice(0, 500) || null,
        page_views: isPageView ? 1 : 0,
        duration_seconds: duration ?? 0,
      });
    } else {
      const update: Record<string, unknown> = {
        last_seen_at: now,
        user_id: userId, // attach identity if the user logged in mid-session
        page_views: (existing.page_views ?? 0) + (isPageView ? 1 : 0),
      };
      if (duration !== null) update.duration_seconds = duration;
      await supabase.from('sessions').update(update).eq('id', sessionId);
    }

    await supabase.from('events').insert({
      session_id: sessionId,
      user_id: userId,
      event_name: eventName,
      page: typeof page === 'string' ? page.slice(0, 200) : null,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      created_at: now,
    });

    res.json({ ok: true });
  } catch (error: any) {
    console.error('Error recording event:', error);
    // Tracking must never break the app.
    res.json({ ok: true });
  }
});

// ── Admin analytics (mounted at /api/admin/analytics) ─────────────
export const adminAnalyticsRouter = Router();
adminAnalyticsRouter.use(requireAdmin);

interface RawEvent {
  id: number;
  session_id: string | null;
  user_id: string | null;
  event_name: string;
  page: string | null;
  created_at: string;
}

const FUNNELS: Array<{ name: string; steps: string[] }> = [
  { name: 'Discovery → Answer', steps: ['search_performed', 'question_viewed', 'answer_revealed'] },
  { name: 'Upload Flow', steps: ['upload_dialog_opened', 'upload_submitted'] },
];

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

async function fetchEvents(days: number): Promise<RawEvent[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('id, session_id, user_id, event_name, page, created_at')
    .gte('created_at', daysAgoISO(days))
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RawEvent[];
}

/** GET /api/admin/analytics/overview?days=30 */
adminAnalyticsRouter.get('/overview', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const supabase = createServerSupabase();
    const since = daysAgoISO(days);

    const [events, sessions] = await Promise.all([
      fetchEvents(days),
      supabase
        .from('sessions')
        .select('duration_seconds')
        .gte('last_seen_at', since),
    ]);

    const pageViews = events.filter((e) => e.event_name === 'page_view').length;
    const sessionIds = new Set(events.map((e) => e.session_id).filter(Boolean));
    const userIds = new Set(events.map((e) => e.user_id).filter(Boolean));
    const durations = (sessions.data ?? [])
      .map((s) => s.duration_seconds ?? 0)
      .filter((d: number) => d > 0);
    const avgSessionDuration = durations.length
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 0;

    res.json({
      sessions: sessionIds.size,
      pageViews,
      uniqueUsers: userIds.size,
      avgSessionDuration,
      totalEvents: events.length,
    });
  } catch (error: any) {
    console.error('Error loading analytics overview:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/series?days=30 — events/sessions per day */
adminAnalyticsRouter.get('/series', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(days);

    const byDay = new Map<string, { date: string; pageViews: number; events: number; sessions: Set<string> }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      byDay.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), pageViews: 0, events: 0, sessions: new Set() });
    }

    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      const row = byDay.get(day);
      if (!row) continue;
      row.events += 1;
      if (e.event_name === 'page_view') row.pageViews += 1;
      if (e.session_id) row.sessions.add(e.session_id);
    }

    res.json(
      [...byDay.values()].map((r) => ({ date: r.date, pageViews: r.pageViews, events: r.events, sessions: r.sessions.size }))
    );
  } catch (error: any) {
    console.error('Error loading analytics series:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/pages?days=30 — top pages by views */
adminAnalyticsRouter.get('/pages', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(days);

    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.event_name !== 'page_view' || !e.page) continue;
      counts.set(e.page, (counts.get(e.page) ?? 0) + 1);
    }

    res.json(
      [...counts.entries()]
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15)
    );
  } catch (error: any) {
    console.error('Error loading analytics pages:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/events?days=30 — top actions (excluding page views) */
adminAnalyticsRouter.get('/events', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(days);

    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.event_name === 'page_view') continue;
      counts.set(e.event_name, (counts.get(e.event_name) ?? 0) + 1);
    }

    res.json(
      [...counts.entries()]
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
    );
  } catch (error: any) {
    console.error('Error loading analytics events:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/funnels?days=30 — step conversion per funnel */
adminAnalyticsRouter.get('/funnels', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(days);

    // Group ordered events per session
    const perSession = new Map<string, Array<{ event: string; at: string }>>();
    for (const e of events) {
      if (!e.session_id) continue;
      if (!perSession.has(e.session_id)) perSession.set(e.session_id, []);
      perSession.get(e.session_id)!.push({ event: e.event_name, at: e.created_at });
    }

    const result = FUNNELS.map((funnel) => {
      let reached = new Set<string>();
      const steps: Array<{ event: string; sessions: number; conversion: number | null }> = [];

      funnel.steps.forEach((step, idx) => {
        const next = new Set<string>();
        for (const [sessionId, eventsList] of perSession) {
          if (idx === 0) {
            if (eventsList.some((e) => e.event === step)) next.add(sessionId);
            continue;
          }
          // Must have reached the previous step, then this step after it
          const prevIdx = eventsList.findIndex((e) => e.event === funnel.steps[idx - 1]);
          if (prevIdx === -1) continue;
          if (eventsList.slice(prevIdx).some((e) => e.event === step)) next.add(sessionId);
        }
        const conversion =
          idx === 0 || reached.size === 0 ? null : next.size / reached.size;
        reached = next;
        steps.push({ event: step, sessions: reached.size, conversion });
      });

      return { name: funnel.name, steps };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error loading analytics funnels:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});