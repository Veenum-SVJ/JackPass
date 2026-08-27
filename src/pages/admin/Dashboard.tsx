import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, FileText, Clock, CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
        <div className="relative p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-4 font-headline">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Admin Panel
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Manage exam papers, review submissions, and keep the platform running smoothly.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-lg font-semibold font-headline mb-4">Overview</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="relative overflow-hidden">
                <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Exam Papers
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold font-headline">{stats?.total ?? 0}</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-amber-200 dark:border-amber-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Review
                  </CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline text-amber-600">
                    {stats?.pending ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Approved
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline text-emerald-600">
                    {stats?.approved ?? 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rejected
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-headline text-red-600">
                    {stats?.rejected ?? 0}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold font-headline mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => navigate('/admin/questions')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold font-headline">Exam Paper Moderation</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Review and approve pending exam papers submitted by students.
                  </p>
                  {stats && stats.pending > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {stats.pending} pending
                    </Badge>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold font-headline">Users</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {stats?.totalUsers ?? 0} registered users on the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
