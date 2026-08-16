'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ArrowUpDown, Eye, Edit, Check, X, Loader2 } from 'lucide-react';
import { QuestionReviewCard } from '@/components/admin/QuestionReviewCard';
import { cn } from '@/lib/utils';

interface AdminQuestion {
  id: string;
  title: string;
  institution: string;
  course: string;
  year: number;
  semester: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  content_preview: string;
  full_content: string;
  uploader_id: string;
  created_at: string;
  ai_extracted_data?: any;
  answer?: string;
  explanation?: string;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [institutions, setInstitutions] = useState<string[]>([]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (institutionFilter) params.append('institution', institutionFilter);

      const response = await fetch(`/api/admin/questions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // Fetch unique institutions for filter
    fetch('/api/admin/questions?institutions=true')
      .then(res => res.json())
      .then(data => setInstitutions(data))
      .catch(console.error);
  }, [search, statusFilter, institutionFilter]);

  const handleStatusChange = async (id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/questions/${id}/${action}`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchQuestions(); // Refresh
      }
    } catch (error) {
      console.error(`Failed to ${action} question:`, error);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (institutionFilter && q.institution !== institutionFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        q.title.toLowerCase().includes(searchLower) ||
        q.institution.toLowerCase().includes(searchLower) ||
        q.course.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
              onChange={e => setStatusFilter(e.target.value as any)}
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
      {loading ? (
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
      ) : filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No questions found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuestions.map(question => (
            <QuestionReviewCard
              key={question.id}
              question={question}
              onApprove={() => handleStatusChange(question.id, 'approve')}
              onReject={() => handleStatusChange(question.id, 'reject')}
            />
          ))}
        </div>
      )}
    </div>
  );
}