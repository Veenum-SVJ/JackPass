import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileQuestion, Clock, CheckCircle, XCircle } from 'lucide-react';
import { QuestionReviewCard } from '@/components/admin/QuestionReviewCard';
import {
  useAdminQuestions,
  useAdminInstitutions,
  useModerateQuestion,
  type QuestionStatus,
} from '@/hooks/useAdminQuestions';
import { useToast } from '@/hooks/use-toast';

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuestionStatus>('pending');
  const [institutionFilter, setInstitutionFilter] = useState('');

  const { data: questions = [], isLoading } = useAdminQuestions({
    search: debouncedSearch,
    status: statusFilter,
    institution: institutionFilter,
  });
  const { data: institutions = [] } = useAdminInstitutions();
  const moderateQuestion = useModerateQuestion();

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (id: string, action: 'approve' | 'reject') => {
    try {
      await moderateQuestion.mutateAsync({ id, action });
      toast({
        title: action === 'approve' ? 'Question Approved' : 'Question Rejected',
        description: `The question has been ${action}d successfully.`,
      });
    } catch (error: any) {
      console.error(`Failed to ${action} question:`, error);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || `Could not ${action} the question.`,
      });
    }
  };

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const approvedCount = questions.filter(q => q.status === 'approved').length;
  const rejectedCount = questions.filter(q => q.status === 'rejected').length;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-3 font-headline">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Moderation
              </span>
              <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
                Question Moderation
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Review and approve questions submitted by students.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {pendingCount} Pending
              </Badge>
              <Badge variant="default" className="text-sm gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                {approvedCount} Approved
              </Badge>
              <Badge variant="destructive" className="text-sm gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                {rejectedCount} Rejected
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | QuestionStatus)}
              className="border rounded-lg px-4 py-2 bg-background min-w-[150px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
              className="border rounded-lg px-4 py-2 bg-background min-w-[200px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="">All Institutions</option>
              {institutions.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Questions Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-3/4 animate-pulse bg-muted rounded" />
                <div className="h-4 w-1/2 animate-pulse bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full animate-pulse bg-muted rounded" />
                <div className="h-4 w-full animate-pulse bg-muted rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
          <CardContent className="relative py-12 text-center">
            <div className="bg-primary/10 text-primary p-3 rounded-full mx-auto mb-4 w-fit">
              <FileQuestion className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold font-headline mb-2">No Questions Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {statusFilter === 'pending' 
                ? 'All caught up! No pending questions to review.'
                : 'No questions match your current filters. Try adjusting your search criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {questions.map(question => (
            <QuestionReviewCard
              key={question.id}
              question={question}
              onApprove={() => handleStatusChange(question.id, 'approve')}
              onReject={() => handleStatusChange(question.id, 'reject')}
            />
          ))}
        </div>
      )}

      {moderateQuestion.isPending && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <Badge className="text-sm gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating question...
          </Badge>
        </div>
      )}
    </div>
  );
}
