/**
 * Analytics aggregation — single owner of all summary logic.
 *
 * Used by:
 *  - server/routes/analytics.ts (admin dashboard endpoints)
 *  - server/routes/cron.ts (weekly email digest)
 * so a change to how metrics are computed lands in exactly one place.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RawEvent {
  id: number;
  session_id: string | null;
  user_id: string | null;
  event_name: string;
  page: string | null;
  created_at: string;
}

export interface Overview {
  sessions: number;
  pageViews: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  totalEvents: number;
}

export interface SeriesPoint {
  date: string;
  pageViews: number;
  events: number;
  sessions: number;
}

export interface FunnelStep {
  event: string;
  sessions: number;
  conversion: number | null;
}

export interface Funnel {
  name: string;
  steps: FunnelStep[];
}

export interface AnalyticsSummary {
  overview: Overview;
  series: SeriesPoint[];
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
  funnels: Funnel[];
}

export const FUNNELS: Array<{ name: string; steps: string[] }> = [
  { name: 'Discovery → Answer', steps: ['search_performed', 'question_viewed', 'answer_revealed'] },
  { name: 'Upload Flow', steps: ['upload_dialog_opened', 'upload_submitted'] },
];

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** Load raw events for the last `days` days (ascending). */
export async function fetchEvents(supabase: SupabaseClient, days: number): Promise<RawEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, session_id, user_id, event_name, page, created_at')
    .gte('created_at', daysAgoISO(days))
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RawEvent[];
}

/** Pure overview computation from raw events + session durations. */
export function computeOverview(events: RawEvent[], sessionDurations: number[]): Overview {
  const pageViews = events.filter((e) => e.event_name === 'page_view').length;
  const sessionIds = new Set(events.map((e) => e.session_id).filter(Boolean));
  const userIds = new Set(events.map((e) => e.user_id).filter(Boolean));
  const durations = sessionDurations.filter((d) => d > 0);
  const avgSessionDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  return {
    sessions: sessionIds.size,
    pageViews,
    uniqueUsers: userIds.size,
    avgSessionDuration,
    totalEvents: events.length,
  };
}

/** Overview counts for the last `days` days. */
export async function fetchOverview(supabase: SupabaseClient, days: number): Promise<Overview> {
  const since = daysAgoISO(days);
  const [events, sessions] = await Promise.all([
    fetchEvents(supabase, days),
    supabase.from('sessions').select('duration_seconds').gte('last_seen_at', since),
  ]);

  const durations = ((sessions.data ?? []) as Array<{ duration_seconds?: number }>).map(
    (s) => s.duration_seconds ?? 0
  );
  return computeOverview(events, durations);
}

/** Events/sessions per day, zero-filled across the whole window. */
export function buildSeries(events: RawEvent[], days: number, now = new Date()): SeriesPoint[] {
  const byDay = new Map<string, SeriesPoint & { _sessions: Set<string> }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const date = d.toISOString().slice(0, 10);
    byDay.set(date, { date, pageViews: 0, events: 0, sessions: 0, _sessions: new Set() });
  }

  for (const e of events) {
    const row = byDay.get(e.created_at.slice(0, 10));
    if (!row) continue;
    row.events += 1;
    if (e.event_name === 'page_view') row.pageViews += 1;
    if (e.session_id) row._sessions.add(e.session_id);
  }

  return [...byDay.values()].map(({ _sessions, ...r }) => ({ ...r, sessions: _sessions.size }));
}

/** Top pages by page_view count. */
export function buildTopPages(events: RawEvent[], limit = 15): Array<{ page: string; views: number }> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.event_name !== 'page_view' || !e.page) continue;
    counts.set(e.page, (counts.get(e.page) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/** Top non-page-view actions. */
export function buildTopEvents(events: RawEvent[], limit = 20): Array<{ event: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.event_name === 'page_view') continue;
    counts.set(e.event_name, (counts.get(e.event_name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Step conversion per defined funnel (ordered per session). */
export function buildFunnels(events: RawEvent[]): Funnel[] {
  const perSession = new Map<string, Array<{ event: string; at: string }>>();
  for (const e of events) {
    if (!e.session_id) continue;
    if (!perSession.has(e.session_id)) perSession.set(e.session_id, []);
    perSession.get(e.session_id)!.push({ event: e.event_name, at: e.created_at });
  }

  return FUNNELS.map((funnel) => {
    let reached = new Set<string>();
    const steps: FunnelStep[] = [];

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
      const conversion = idx === 0 || reached.size === 0 ? null : next.size / reached.size;
      reached = next;
      steps.push({ event: step, sessions: reached.size, conversion });
    });

    return { name: funnel.name, steps };
  });
}

/** Full summary in one call — one event fetch, shared by routes and digest. */
export async function buildSummary(supabase: SupabaseClient, days: number): Promise<AnalyticsSummary> {
  const since = daysAgoISO(days);
  const [events, sessions] = await Promise.all([
    fetchEvents(supabase, days),
    supabase.from('sessions').select('duration_seconds').gte('last_seen_at', since),
  ]);
  const durations = ((sessions.data ?? []) as Array<{ duration_seconds?: number }>).map(
    (s) => s.duration_seconds ?? 0
  );

  return {
    overview: computeOverview(events, durations),
    series: buildSeries(events, days),
    topPages: buildTopPages(events),
    topEvents: buildTopEvents(events),
    funnels: buildFunnels(events),
  };
}
