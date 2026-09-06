import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface AnalyticsOverview {
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

export interface PageStat {
  page: string;
  views: number;
}

export interface EventStat {
  event: string;
  count: number;
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

function fetchJson<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

/** Aggregate overview (sessions, page views, users, avg duration). */
export function useAnalyticsOverview(days: number) {
  return useQuery({
    queryKey: ['admin-analytics-overview', days],
    queryFn: () => fetchJson<AnalyticsOverview>(`/api/admin/analytics/overview?days=${days}`),
  });
}

/** Daily time series for charts. */
export function useAnalyticsSeries(days: number) {
  return useQuery({
    queryKey: ['admin-analytics-series', days],
    queryFn: () => fetchJson<SeriesPoint[]>(`/api/admin/analytics/series?days=${days}`),
  });
}

/** Top pages by views. */
export function useAnalyticsPages(days: number) {
  return useQuery({
    queryKey: ['admin-analytics-pages', days],
    queryFn: () => fetchJson<PageStat[]>(`/api/admin/analytics/pages?days=${days}`),
  });
}

/** Top actions by event name. */
export function useAnalyticsEvents(days: number) {
  return useQuery({
    queryKey: ['admin-analytics-events', days],
    queryFn: () => fetchJson<EventStat[]>(`/api/admin/analytics/events?days=${days}`),
  });
}

/** Funnel conversion analysis. */
export function useAnalyticsFunnels(days: number) {
  return useQuery({
    queryKey: ['admin-analytics-funnels', days],
    queryFn: () => fetchJson<Funnel[]>(`/api/admin/analytics/funnels?days=${days}`),
  });
}