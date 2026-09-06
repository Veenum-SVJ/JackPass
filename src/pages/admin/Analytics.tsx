import { useState } from 'react';
import {
  useAnalyticsOverview,
  useAnalyticsSeries,
  useAnalyticsPages,
  useAnalyticsEvents,
  useAnalyticsFunnels,
} from '@/hooks/useAdminAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Eye,
  Users,
  Timer,
  CalendarRange,
  BarChart3,
  MousePointerClick,
  Filter,
  Mail,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSendDigest } from '@/hooks/useAdminAnalytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

const DAY_RANGES = [7, 30, 90] as const;

const EVENT_LABELS: Record<string, string> = {
  search_performed: 'Search',
  question_viewed: 'Question Viewed',
  answer_revealed: 'Answer Revealed',
  upload_dialog_opened: 'Upload Opened',
  upload_submitted: 'Upload Submitted',
  answer_generated: 'Answers Generated',
  admin_approved: 'Approved (Admin)',
  admin_rejected: 'Rejected (Admin)',
  admin_bulk_approved: 'Bulk Approved',
  admin_bulk_rejected: 'Bulk Rejected',
  reprocess_started: 'Re-process Started',
  reprocess_completed: 'Re-process Completed',
  feedback_upvote: 'Feedback Upvote',
  session_end: 'Session End',
};

function prettyEvent(event: string): string {
  return EVENT_LABELS[event] ?? event.replace(/_/g, ' ');
}

function prettyPage(page: string): string {
  if (page === '/') return 'Home';
  return page;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(30);

  const overview = useAnalyticsOverview(days);
  const series = useAnalyticsSeries(days);
  const pages = useAnalyticsPages(days);
  const events = useAnalyticsEvents(days);
  const funnels = useAnalyticsFunnels(days);
  const sendDigest = useSendDigest();

  const statCards = [
    { label: 'Sessions', value: overview.data?.sessions ?? null, icon: Activity },
    { label: 'Page Views', value: overview.data?.pageViews ?? null, icon: Eye },
    { label: 'Unique Users', value: overview.data?.uniqueUsers ?? null, icon: Users },
    {
      label: 'Avg Session Duration',
      value: overview.data ? formatDuration(overview.data.avgSessionDuration) : null,
      icon: Timer,
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
        <div className="relative p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-4 font-headline">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Analytics
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
            Usage Analytics
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            See which features students use the most — page views, actions, and conversion funnels.
          </p>
        </div>
      </section>

      {/* Date range */}
      <section className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="h-4 w-4" />
          Showing the last
        </div>
        <div className="flex items-center gap-1">
          {DAY_RANGES.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
            >
              {d} days
            </Button>
          ))}
        </div>
      </section>

      {/* Stat cards */}
      <section>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {overview.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold font-headline">{card.value ?? 0}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Time series */}
      <section>
        <h2 className="text-lg font-semibold font-headline mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Activity Over Time
        </h2>
        <Card>
          <CardContent className="pt-6">
            {series.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={series.data ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#3b82f6" fill="url(#views)" />
                  <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#10b981" fill="url(#sessions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top pages */}
        <section>
          <h2 className="text-lg font-semibold font-headline mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Top Pages
          </h2>
          <Card>
            <CardContent className="pt-6">
              {pages.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (pages.data ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm py-10 text-center">No page views yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={pages.data ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="page" tick={{ fontSize: 11 }} tickFormatter={prettyPage} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(label: string) => prettyPage(label)} />
                    <Bar dataKey="views" name="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Top events */}
        <section>
          <h2 className="text-lg font-semibold font-headline mb-4 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            Top Features Used
          </h2>
          <Card>
            <CardContent className="pt-6">
              {events.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (events.data ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm py-10 text-center">No tracked actions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(events.data ?? []).map((e) => {
                    const max = Math.max(...(events.data ?? []).map((x) => x.count), 1);
                    return (
                      <li key={e.event} className="flex items-center gap-3">
                        <span className="text-sm w-44 truncate">{prettyEvent(e.event)}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.max(4, (e.count / max) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-muted-foreground w-10 text-right">{e.count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Funnels */}
      <section>
        <h2 className="text-lg font-semibold font-headline mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Conversion Funnels
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {funnels.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (funnels.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No funnel data yet — events will appear as students use the app.
              </CardContent>
            </Card>
          ) : (
            (funnels.data ?? []).map((funnel) => (
              <Card key={funnel.name}>
                <CardHeader>
                  <CardTitle className="text-base">{funnel.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {funnel.steps.map((step, idx) => (
                    <div key={step.event}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {idx + 1}. {prettyEvent(step.event)}
                        </span>
                        <span className="font-mono">{step.sessions} sessions</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${Math.max(
                              idx === 0 ? 100 : 3,
                              idx === 0 ? 100 : (step.conversion ?? 0) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      {step.conversion !== null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Badge variant="secondary" className="text-[10px] mr-1">
                            {Math.round(step.conversion * 100)}%
                          </Badge>
                          converted from previous step
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Weekly email digest */}
      <section>
        <h2 className="text-lg font-semibold font-headline mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Weekly Email Digest
        </h2>
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Every Monday 08:00 UTC, all admins receive a 7-day summary.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires RESEND_API_KEY and CRON_SECRET in Vercel env; recipients are admin profiles.
                </p>
              </div>
              <Button
                onClick={() =>
                  sendDigest.mutate(
                    { days: 7 },
                    {
                      onSuccess: (r) =>
                        toast({
                          title: 'Digest sent',
                          description: `Sent to ${r.to.join(', ')} for ${r.window.start} → ${r.window.end}.`,
                        }),
                      onError: (e: Error) => toast({ title: 'Digest failed', description: e.message, variant: 'destructive' }),
                    }
                  )
                }
                disabled={sendDigest.isPending}
              >
                {sendDigest.isPending ? 'Sending…' : 'Send test digest now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}