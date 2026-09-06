/**
 * Weekly analytics digest email — pure rendering (HTML + text).
 * No dependencies; server routes and tests share these functions.
 */
import type { AnalyticsSummary } from './analytics-summary';

export interface DigestPayload {
  summary: AnalyticsSummary;
  /** Inclusive range the summary covers, e.g. 2026-08-30 → 2026-09-06. */
  rangeStart: string;
  rangeEnd: string;
  appUrl: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function fmtDuration(seconds: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export function eventLabel(event: string): string {
  return event
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stat(label: string, value: string): string {
  return `<td width="33%" style="padding:6px;"><div style="background:#f8fafc;border-radius:8px;padding:14px;text-align:center;font-family:Arial,sans-serif;">
    <div style="font-size:22px;font-weight:bold;color:#0f172a;">${esc(value)}</div>
    <div style="font-size:11px;color:#64748b;text-transform:uppercase;">${esc(label)}</div>
  </div></td>`;
}

function rows(items: Array<[string, string]>): string {
  return items
    .map(
      ([left, right], i) =>
        `<tr><td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#0f172a;">${i + 1}. ${esc(left)}
        <span style="float:right;color:#7c3aed;font-weight:bold;">${esc(right)}</span></td></tr>`
    )
    .join('');
}

function section(title: string, body: string): string {
  return `<h3 style="font-size:14px;color:#0f172a;margin:20px 0 8px;font-family:Arial,sans-serif;">${esc(title)}</h3>
  <table width="100%" style="background:#f8fafc;border-radius:8px;border-collapse:collapse;">${body}</table>`;
}

/** Render the digest as inline-styled HTML (email-client safe). */
export function renderDigestHtml(p: DigestPayload): string {
  const { overview, topPages, topEvents, funnels } = p.summary;

  const pagesBody = rows(topPages.slice(0, 5).map((x) => [x.page, `${x.views} views`]));
  const eventsBody = rows(topEvents.slice(0, 5).map((x) => [eventLabel(x.event), String(x.count)]));
  const funnelsBody = funnels
    .map((f) => {
      const steps = f.steps
        .map((s, i) => {
          const pct = s.conversion === null ? '—' : `${Math.round(s.conversion * 100)}%`;
          const color = s.conversion !== null && s.conversion < 0.5 ? '#dc2626' : '#16a34a';
          return `${i > 0 ? ' → ' : ''}${esc(eventLabel(s.event))} <strong style="color:${color}">${pct}</strong>`;
        })
        .join('');
      return `<tr><td style="padding:8px 12px;font-family:Arial,sans-serif;font-size:13px;color:#334155;"><strong>${esc(f.name)}</strong><br/>${steps}</td></tr>`;
    })
    .join('');

  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
  <div style="background:#7c3aed;border-radius:12px 12px 0 0;padding:20px 24px;">
    <div style="color:#fff;font-size:18px;font-weight:bold;">JackPass Weekly Digest</div>
    <div style="color:#e9d5ff;font-size:13px;margin-top:4px;">${esc(p.rangeStart)} → ${esc(p.rangeEnd)}</div>
  </div>
  <div style="background:#fff;border-radius:0 0 12px 12px;padding:16px 12px 24px;">
    <table width="100%" style="border-collapse:collapse;"><tr>
      ${stat('Sessions', String(overview.sessions))}${stat('Page Views', String(overview.pageViews))}${stat('Users', String(overview.uniqueUsers))}
    </tr><tr>
      ${stat('Avg Session', fmtDuration(overview.avgSessionDuration))}${stat('Total Events', String(overview.totalEvents))}<td width="33%">&nbsp;</td>
    </tr></table>
    ${topPages.length ? section('Top Pages', pagesBody) : ''}
    ${topEvents.length ? section('Top Features', eventsBody) : ''}
    ${funnels.length ? section('Funnels', funnelsBody) : ''}
    <a href="${esc(p.appUrl)}/admin/analytics" style="display:block;margin:24px auto 0;width:220px;text-align:center;background:#7c3aed;color:#fff;text-decoration:none;font-size:14px;font-weight:bold;padding:11px 0;border-radius:8px;">View full analytics →</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;">Weekly usage summary · JackPass</p>
</div>`;
}

/** Plain-text version for mail clients that reject HTML. */
export function renderDigestText(p: DigestPayload): string {
  const o = p.summary.overview;
  const lines: string[] = [
    `JackPass Weekly Digest — ${p.rangeStart} to ${p.rangeEnd}`,
    '',
    `Sessions: ${o.sessions} | Page views: ${o.pageViews} | Users: ${o.uniqueUsers}`,
    `Avg session: ${fmtDuration(o.avgSessionDuration)} | Total events: ${o.totalEvents}`,
  ];
  if (p.summary.topPages.length) {
    lines.push('', 'Top pages:');
    p.summary.topPages.slice(0, 5).forEach((x, i) => lines.push(`  ${i + 1}. ${x.page} — ${x.views} views`));
  }
  if (p.summary.topEvents.length) {
    lines.push('', 'Top features:');
    p.summary.topEvents.slice(0, 5).forEach((x, i) => lines.push(`  ${i + 1}. ${eventLabel(x.event)} — ${x.count}`));
  }
  lines.push('', `Full analytics: ${p.appUrl}/admin/analytics`);
  return lines.join('\n');
}
