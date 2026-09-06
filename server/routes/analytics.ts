import { Router } from 'express';
import { createServerSupabase } from '../../src/lib/supabase-server';
import { getBearerToken, getUserFromRequest, requireAdmin } from '../middleware';
import {
  fetchEvents,
  fetchOverview,
  buildSeries,
  buildTopPages,
  buildTopEvents,
  buildFunnels,
} from '../../src/lib/analytics-summary';

/**
 * POST /api/events
 * Open, fire-and-forget usage tracking. Attaches the user id when a valid
 * session token is present; never fails the client on errors.
 * (Mounted at /api/events in both entry points, so the route itself is "/" —
 * a nested "/events" here would double the path.)
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

/** GET /api/admin/analytics/overview?days=30 */
adminAnalyticsRouter.get('/overview', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    res.json(await fetchOverview(createServerSupabase(), days));
  } catch (error: any) {
    console.error('Error loading analytics overview:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/series?days=30 — events/sessions per day */
adminAnalyticsRouter.get('/series', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildSeries(events, days));
  } catch (error: any) {
    console.error('Error loading analytics series:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/pages?days=30 — top pages by views */
adminAnalyticsRouter.get('/pages', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildTopPages(events));
  } catch (error: any) {
    console.error('Error loading analytics pages:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/events?days=30 — top actions (excluding page views) */
adminAnalyticsRouter.get('/events', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildTopEvents(events));
  } catch (error: any) {
    console.error('Error loading analytics events:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/** GET /api/admin/analytics/funnels?days=30 — step conversion per funnel */
adminAnalyticsRouter.get('/funnels', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const events = await fetchEvents(createServerSupabase(), days);
    res.json(buildFunnels(events));
  } catch (error: any) {
    console.error('Error loading analytics funnels:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});
