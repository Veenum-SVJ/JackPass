import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Question Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and approve pending questions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-sm">
            {questions.filter(q => q.status === 'pending').length} Pending
          </Badge>
          <Badge variant="default" className="text-sm">
            {questions.filter(q => q.status === 'approved').length} Approved
          </Badge>
          <Badge variant="destructive" className="text-sm">
            {questions.filter(q => q.status === 'rejected').length} Rejected
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | QuestionStatus)}
              className="border rounded-lg px-4 py-2 bg-background min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
              className="border rounded-lg px-4 py-2 bg-background min-w-[200px]"
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No questions found matching your filters.</p>
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
          <Badge className="text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating question...
          </Badge>
        </div>
      )}
    </div>
  );
}
