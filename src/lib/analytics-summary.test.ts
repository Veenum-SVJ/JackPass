import { describe, it, expect } from 'vitest';
import {
  computeOverview,
  buildSeries,
  buildTopPages,
  buildTopEvents,
  buildFunnels,
} from './analytics-summary';
import { renderDigestHtml, renderDigestText, fmtDuration, eventLabel } from './digest-email';
import type { RawEvent, AnalyticsSummary } from './analytics-summary';

function ev(partial: Partial<RawEvent> & { id: number }): RawEvent {
  return {
    session_id: 's1',
    user_id: null,
    event_name: 'page_view',
    page: '/',
    created_at: '2026-09-01T10:00:00.000Z',
    ...partial,
  };
}

describe('computeOverview', () => {
  it('counts sessions, page views, users, and averages durations', () => {
    const events: RawEvent[] = [
      ev({ id: 1, session_id: 's1', user_id: 'u1' }),
      ev({ id: 2, session_id: 's1' }),
      ev({ id: 3, session_id: 's2', user_id: 'u1', event_name: 'search_performed', page: null }),
    ];
    const overview = computeOverview(events, [60, 120, 30]);
    expect(overview).toEqual({
      sessions: 2,
      pageViews: 2,
      uniqueUsers: 1,
      avgSessionDuration: 70,
      totalEvents: 3,
    });
  });

  it('ignores zero durations for the average', () => {
    const overview = computeOverview([ev({ id: 1 })], [0, 90]);
    expect(overview.avgSessionDuration).toBe(90);
    expect(computeOverview([], []).avgSessionDuration).toBe(0);
  });
});

describe('buildSeries', () => {
  it('zero-fills days without events and counts distinct sessions per day', () => {
    const events: RawEvent[] = [
      ev({ id: 1, created_at: '2026-09-01T08:00:00.000Z', session_id: 'a' }),
      ev({ id: 2, created_at: '2026-09-01T09:00:00.000Z', session_id: 'b' }),
      ev({ id: 3, created_at: '2026-09-01T10:00:00.000Z', session_id: 'a' }),
    ];
    const series = buildSeries(events, 3, new Date('2026-09-03T12:00:00.000Z'));
    expect(series.map((d) => d.date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
    expect(series[0]).toMatchObject({ events: 3, pageViews: 3, sessions: 2 });
    expect(series[1]).toMatchObject({ events: 0, pageViews: 0, sessions: 0 });
  });
});

describe('top lists', () => {
  it('ranks pages by views and excludes page views from features', () => {
    const events: RawEvent[] = [
      ev({ id: 1, page: '/library' }),
      ev({ id: 2, page: '/library' }),
      ev({ id: 3, page: '/' }),
      ev({ id: 4, event_name: 'upload_submitted', page: null }),
    ];
    expect(buildTopPages(events)).toEqual([
      { page: '/library', views: 2 },
      { page: '/', views: 1 },
    ]);
    expect(buildTopEvents(events)).toEqual([{ event: 'upload_submitted', count: 1 }]);
  });
});

describe('buildFunnels', () => {
  it('counts ordered step conversion per session', () => {
    const events: RawEvent[] = [
      // s1 completes the funnel
      ev({ id: 1, session_id: 's1', event_name: 'search_performed' }),
      ev({ id: 2, session_id: 's1', event_name: 'question_viewed' }),
      ev({ id: 3, session_id: 's1', event_name: 'answer_revealed' }),
      // s2 stops after step 1
      ev({ id: 4, session_id: 's2', event_name: 'search_performed' }),
    ];
    const funnel = buildFunnels(events).find((f) => f.name === 'Discovery → Answer');
    expect(funnel).toBeDefined();
    if (!funnel) return;
    expect(funnel.steps.map((s) => s.sessions)).toEqual([2, 1, 1]);
    expect(funnel.steps[1]?.conversion).toBeCloseTo(0.5);
    expect(funnel.steps[0]?.conversion).toBeNull();
  });
});

describe('digest email', () => {
  const summary: AnalyticsSummary = {
    overview: { sessions: 12, pageViews: 34, uniqueUsers: 5, avgSessionDuration: 95, totalEvents: 40 },
    series: [],
    topPages: [{ page: '/library', views: 20 }],
    topEvents: [{ event: 'search_performed', count: 9 }],
    funnels: [
      {
        name: 'Upload Flow',
        steps: [
          { event: 'upload_dialog_opened', sessions: 10, conversion: null },
          { event: 'upload_submitted', sessions: 4, conversion: 0.4 },
        ],
      },
    ],
  };
  const payload = { summary, rangeStart: '2026-08-31', rangeEnd: '2026-09-06', appUrl: 'https://app.test' };

  it('escapes html-sensitive values', () => {
    const html = renderDigestHtml({
      ...payload,
      summary: { ...summary, topPages: [{ page: '<script>alert(1)</script>', views: 1 }] },
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders html and text with the key numbers and a low-conversion flag', () => {
    const html = renderDigestHtml(payload);
    expect(html).toContain('JackPass Weekly Digest');
    expect(html).toContain('2026-08-31 → 2026-09-06');
    expect(html).toContain('40%'); // funnel conversion
    expect(html).toContain('color:#dc2626'); // below-50% marker
    expect(html).toContain('1m 35s');

    const text = renderDigestText(payload);
    expect(text).toContain('Sessions: 12');
    expect(text).toContain('1. /library — 20 views');
    expect(text).toContain('Search Performed — 9');
  });

  it('formats durations and labels', () => {
    expect(fmtDuration(0)).toBe('—');
    expect(fmtDuration(45)).toBe('45s');
    expect(fmtDuration(125)).toBe('2m 5s');
    expect(eventLabel('search_performed')).toBe('Search Performed');
  });
});
