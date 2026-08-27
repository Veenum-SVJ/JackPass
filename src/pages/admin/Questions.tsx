import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, FileText, Clock, CheckCircle, XCircle, CheckCheck, XSquare, ChevronLeft, ChevronRight, Download, AlertTriangle, RefreshCw, Wand2 } from 'lucide-react';
import { QuestionReviewCard } from '@/components/admin/QuestionReviewCard';
import {
  useAdminQuestions,
  useAdminInstitutions,
  useModerateQuestion,
  useBulkModerateQuestion,
  useUpdateQuestion,
  useReprocessQuestion,
  useGenerateAnswer,
  useReprocessStatus,
  type QuestionStatus,
} from '@/hooks/useAdminQuestions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

type AdminQuestion = {
  id: string;
  title: string;
  institution: string;
  course: string;
  course_code?: string;
  year: number | string;
  semester: string;
  type: string;
  status: string;
  created_at: string;
  ai_extracted_data?: {
    confidence?: { overall: number };
  };
};

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportToCsv(papers: AdminQuestion[], filename: string) {
  const headers = [
    'ID', 'Title', 'Institution', 'Course', 'Course Code', 'Year', 'Semester',
    'Type', 'Status', 'AI Confidence', 'Created At',
  ];

  const rows = papers.map(p => [
    p.id,
    p.title,
    p.institution,
    p.course,
    p.course_code ?? '',
    String(p.year),
    p.semester,
    p.type,
    p.status,
    p.ai_extracted_data?.confidence?.overall != null
      ? `${Math.round(p.ai_extracted_data.confidence.overall * 100)}%`
      : '',
    new Date(p.created_at).toISOString(),
  ]);

  const csv = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(cell => escapeCsv(String(cell))).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuestionStatus>('pending');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [bulkGenProgress, setBulkGenProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [bulkReprocessProgress, setBulkReprocessProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const bulkGenCancelled = useRef(false);
  const bulkReprocessCancelled = useRef(false);
  const bulkGenStartRef = useRef(0);
  const bulkReprocessStartRef = useRef(0);
  const [bulkGenElapsed, setBulkGenElapsed] = useState(0);
  const [bulkReprocessElapsed, setBulkReprocessElapsed] = useState(0);

  // Elapsed timers for both bulk operations
  useEffect(() => {
    if (!bulkGenProgress) { setBulkGenElapsed(0); return; }
    const id = setInterval(() => setBulkGenElapsed(Date.now() - bulkGenStartRef.current), 1000);
    return () => clearInterval(id);
  }, [bulkGenProgress]);
  useEffect(() => {
    if (!bulkReprocessProgress) { setBulkReprocessElapsed(0); return; }
    const id = setInterval(() => setBulkReprocessElapsed(Date.now() - bulkReprocessStartRef.current), 1000);
    return () => clearInterval(id);
  }, [bulkReprocessProgress]);

  const formatEta = (elapsedMs: number, done: number, total: number) => {
    if (done === 0) return 'Calculating...';
    const remaining = total - done;
    const avgPerItem = elapsedMs / done;
    const etaSec = Math.ceil((remaining * avgPerItem) / 1000);
    if (etaSec < 60) return `~${etaSec}s remaining`;
    const min = Math.floor(etaSec / 60);
    const sec = etaSec % 60;
    return `~${min}m ${sec}s remaining`;
  };
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const { data: reprocessStatus } = useReprocessStatus(reprocessingId, !!reprocessingId);

  const { data: questions = [], isLoading } = useAdminQuestions({
    search: debouncedSearch,
    status: statusFilter,
    institution: institutionFilter,
  });
  const { data: institutions = [] } = useAdminInstitutions();
  const moderateQuestion = useModerateQuestion();
  const bulkModerate = useBulkModerateQuestion();
  const updateQuestion = useUpdateQuestion();
  const reprocessQuestion = useReprocessQuestion();
  const generateAnswer = useGenerateAnswer();

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Clear selection and reset page when filters change
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
  }, [debouncedSearch, statusFilter, institutionFilter]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedQuestions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return questions.slice(start, start + PAGE_SIZE);
  }, [questions, safePage]);

  const handleStatusChange = async (id: string, action: 'approve' | 'reject') => {
    try {
      await moderateQuestion.mutateAsync({ id, action });
      toast({
        title: action === 'approve' ? 'Exam Paper Approved' : 'Exam Paper Rejected',
        description: `The exam paper has been ${action}d successfully.`,
      });
    } catch (error: any) {
      console.error(`Failed to ${action} exam paper:`, error);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || `Could not ${action} the exam paper.`,
      });
    }
  };

  const handleBulkGenerateAnswers = async (specificIds?: string[]) => {
    // Find questions that have content but no AI-generated answer
    const candidates = specificIds
      ? questions.filter(q => specificIds.includes(q.id) && q.full_content)
      : questions.filter(q => q.full_content && !q.answer_generated);
    if (candidates.length === 0) {
      toast({ title: 'No questions to process', description: specificIds ? 'Selected questions have no content to generate answers from.' : 'All questions with content already have AI-generated answers.' });
      return;
    }

    bulkGenCancelled.current = false;
    bulkGenStartRef.current = Date.now();
    setBulkGenProgress({ done: 0, total: candidates.length, current: '' });
    let done = 0;
    let failed = 0;

    for (const q of candidates) {
      if (bulkGenCancelled.current) break;
      setBulkGenProgress({ done, total: candidates.length, current: q.title });
      try {
        await generateAnswer.mutateAsync({ id: q.id });
        done++;
      } catch (err) {
        console.error(`Failed to generate answer for ${q.id}:`, err);
        failed++;
      }
    }

    const wasCancelled = bulkGenCancelled.current;
    setBulkGenProgress(null);
    toast({
      title: wasCancelled ? 'Generation Cancelled' : 'Bulk Generation Complete',
      description: wasCancelled
        ? `${done} answer(s) generated before cancellation.`
        : `${done} answer(s) generated successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
    });
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      await bulkModerate.mutateAsync({ ids, action });
      toast({
        title: action === 'approve' ? 'Exam Papers Approved' : 'Exam Papers Rejected',
        description: `${ids.length} exam paper${ids.length > 1 ? 's' : ''} ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });
      setSelectedIds(new Set());
    } catch (error: any) {
      console.error(`Failed to bulk ${action} exam papers:`, error);
      toast({
        variant: 'destructive',
        title: 'Bulk Action Failed',
        description: error.message || `Could not ${action} the selected exam papers.`,
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedQuestions.map(q => q.id)));
    }
  };

  const handleExportCsv = (target: 'all' | 'selected') => {
    const toExport = target === 'selected'
      ? questions.filter(q => selectedIds.has(q.id))
      : questions;

    if (toExport.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing to export', description: 'No exam papers to export.' });
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const label = target === 'selected' ? 'selected' : statusFilter === 'all' ? 'all' : statusFilter;
    exportToCsv(toExport, `exam-papers-${label}-${timestamp}.csv`);

    toast({
      title: 'Export Complete',
      description: `${toExport.length} exam paper${toExport.length > 1 ? 's' : ''} exported as CSV.`,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? 'metaKey' : 'ctrlKey';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/selects
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      // Ctrl/Cmd+A → Select all on page
      if (e[mod] && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        toggleSelectAll();
        return;
      }

      // Escape → Clear selection
      if (e.key === 'Escape' && selectedIds.size > 0) {
        e.preventDefault();
        setSelectedIds(new Set());
        return;
      }

      // Ctrl/Cmd+Shift+A → Approve selected
      if (e[mod] && e.shiftKey && e.key.toUpperCase() === 'A' && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkAction('approve');
        return;
      }

      // Ctrl/Cmd+Shift+R → Reject selected
      if (e[mod] && e.shiftKey && e.key.toUpperCase() === 'R' && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkAction('reject');
        return;
      }

      // Ctrl/Cmd+E → Export all
      if (e[mod] && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExportCsv('all');
        return;
      }

      // Ctrl/Cmd+Shift+E → Export selected
      if (e[mod] && e.shiftKey && e.key.toLowerCase() === 'e' && selectedIds.size > 0) {
        e.preventDefault();
        handleExportCsv('selected');
        return;
      }

      // Ctrl/Cmd+Shift+G → Generate answers for selected
      if (e[mod] && e.shiftKey && e.key.toLowerCase() === 'g' && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkGenerateAnswers(Array.from(selectedIds));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, paginatedQuestions, toggleSelectAll, handleBulkAction, handleExportCsv, handleBulkGenerateAnswers]);

  const allSelected = paginatedQuestions.length > 0 && selectedIds.size === paginatedQuestions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < paginatedQuestions.length;

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const approvedCount = questions.filter(q => q.status === 'approved').length;
  const rejectedCount = questions.filter(q => q.status === 'rejected').length;

  // Generate page number buttons with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

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
                Exam Paper Moderation
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Review and approve exam papers submitted by students.
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

      {/* Mock OCR Warning Banner */}
      {!isLoading && questions.some(q => q.content_preview?.startsWith('[MOCK OCR]') || q.full_content?.startsWith('[MOCK OCR]')) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Mock OCR Detected — Placeholder Content</p>
            <p className="text-xs mt-1">Some exam papers on this page contain fake placeholder text because the OCR engine was unavailable when they were uploaded. These papers need to be re-processed with Gemini Vision to get accurate text extraction. Use the "Re-process" button on each affected card, or click below to re-process all at once.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900"
              onClick={async () => {
                const mockQuestions = questions.filter(q => q.content_preview?.startsWith('[MOCK OCR]') || q.full_content?.startsWith('[MOCK OCR]'));
                const total = mockQuestions.length;
                if (total === 0) return;
                bulkReprocessCancelled.current = false;
                bulkReprocessStartRef.current = Date.now();
                setBulkReprocessProgress({ done: 0, total, current: '' });
                let done = 0;
                let failed = 0;
                for (const q of mockQuestions) {
                  if (bulkReprocessCancelled.current) break;
                  setBulkReprocessProgress({ done, total, current: q.title });
                  try {
                    await reprocessQuestion.mutateAsync({ id: q.id });
                    done++;
                  } catch (err) {
                    console.error(`Failed to reprocess ${q.id}:`, err);
                    failed++;
                  }
                }
                const wasCancelled = bulkReprocessCancelled.current;
                setBulkReprocessProgress(null);
                toast({ title: wasCancelled ? 'Re-process Cancelled' : 'Re-process Complete', description: wasCancelled
                  ? `${done} paper(s) re-processed before cancellation.`
                  : `${done} paper(s) re-processed${failed > 0 ? `, ${failed} failed` : ''}.` });
              }}
              disabled={reprocessQuestion.isPending || !!bulkReprocessProgress}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', reprocessQuestion.isPending && 'animate-spin')} />
              Re-process All Mock OCR Papers ({questions.filter(q => q.content_preview?.startsWith('[MOCK OCR]') || q.full_content?.startsWith('[MOCK OCR]')).length})
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Re-process Progress */}
      {bulkReprocessProgress && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
          <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="font-semibold">Re-processing with Gemini Vision... ({bulkReprocessProgress.done}/{bulkReprocessProgress.total})</p>
            {bulkReprocessProgress.current && (
              <p className="text-xs mt-1">Currently processing: {bulkReprocessProgress.current}</p>
            )}
            <div className="mt-2 w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
              <div
                className="bg-amber-600 dark:bg-amber-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(bulkReprocessProgress.done / bulkReprocessProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs mt-1 opacity-70">{formatEta(bulkReprocessElapsed, bulkReprocessProgress.done, bulkReprocessProgress.total)} · Do not close this page.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { bulkReprocessCancelled.current = true; setBulkReprocessProgress(null); }} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 shrink-0">
            Cancel
          </Button>
        </div>
      )}

      {/* Bulk Generate Answer Progress */}
      {bulkGenProgress && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
          <Wand2 className="h-5 w-5 mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold">Generating AI Answers... ({bulkGenProgress.done}/{bulkGenProgress.total})</p>
            {bulkGenProgress.current && (
              <p className="text-xs mt-1">Currently processing: {bulkGenProgress.current}</p>
            )}
            <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(bulkGenProgress.done / bulkGenProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs mt-1 opacity-70">{formatEta(bulkGenElapsed, bulkGenProgress.done, bulkGenProgress.total)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { bulkGenCancelled.current = true; setBulkGenProgress(null); }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Generate All Answers Banner */}
      {!isLoading && !bulkGenProgress && questions.some(q => q.full_content && !q.answer_generated) && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
          <Wand2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">AI Answers Available</p>
            <p className="text-xs mt-1">Some questions have extracted content but no AI-generated model answer yet. Generate answers to help students study.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900"
              onClick={() => handleBulkGenerateAnswers()}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generate All Answers ({questions.filter(q => q.full_content && !q.answer_generated).length})
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exam papers..."
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

      {/* Bulk Action Bar */}
      {!isLoading && paginatedQuestions.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size === 0
                ? `Select all ${paginatedQuestions.length} on this page`
                : `${selectedIds.size} of ${paginatedQuestions.length} selected on this page`}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExportCsv('selected')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected ({selectedIds.size})
              </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportCsv('all')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export All ({questions.length})
            </Button>
            {selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkModerate.isPending}
                >
                  {bulkModerate.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Approve ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkModerate.isPending}
                >
                  {bulkModerate.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XSquare className="h-4 w-4 mr-2" />
                  )}
                  Reject ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200"
                  onClick={() => handleBulkGenerateAnswers(Array.from(selectedIds))}
                  disabled={generateAnswer.isPending || !!bulkGenProgress}
                >
                  {generateAnswer.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Generate Answers ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Keyboard shortcut hints */}
      {!isLoading && paginatedQuestions.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl+A</kbd> Select all</span>
          <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Esc</kbd> Clear selection</span>
          {selectedIds.size > 0 && (
            <>
              <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl+Shift+A</kbd> Approve</span>
              <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl+Shift+R</kbd> Reject</span>
            </>
          )}
          <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl+E</kbd> Export all</span>
          {selectedIds.size > 0 && (
            <>
              <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl+Shift+E</kbd> Export selected</span>
              <span><kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Ctrl+Shift+G</kbd> Generate answers</span>
            </>
          )}
        </div>
      )}

      {/* Exam Papers Grid */}
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
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold font-headline mb-2">No Exam Papers Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {statusFilter === 'pending'
                ? 'All caught up! No pending exam papers to review.'
                : 'No exam papers match your current filters. Try adjusting your search criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedQuestions.map(question => (
              <QuestionReviewCard
                key={question.id}
                question={question}
                onApprove={() => handleStatusChange(question.id, 'approve')}
                onReject={() => handleStatusChange(question.id, 'reject')}
                onSave={(updates) => {
                  updateQuestion.mutate(
                    { id: question.id, updates },
                    {
                      onSuccess: () => toast({ title: 'Exam Paper Updated', description: 'Changes saved successfully.' }),
                      onError: (err: Error) => toast({ variant: 'destructive', title: 'Update Failed', description: err.message }),
                    }
                  );
                }}
                onReprocess={() => {
                  setReprocessingId(question.id);
                  reprocessQuestion.mutate(
                    { id: question.id },
                    {
                      onSuccess: () => { setReprocessingId(null); toast({ title: 'OCR Re-processed', description: 'Gemini Vision has re-extracted the text from the original image.' }); },
                      onError: (err: Error) => { setReprocessingId(null); toast({ variant: 'destructive', title: 'Re-process Failed', description: err.message }); },
                    }
                  );
                }}
                isReprocessing={reprocessQuestion.isPending && reprocessingId === question.id}
                reprocessStep={reprocessingId === question.id ? reprocessStatus?.step : undefined}
                onGenerateAnswer={() => {
                  generateAnswer.mutate(
                    { id: question.id },
                    {
                      onSuccess: () => toast({ title: 'Answer Generated', description: 'AI model answer has been generated successfully.' }),
                      onError: (err: Error) => toast({ variant: 'destructive', title: 'Generation Failed', description: err.message }),
                    }
                  );
                }}
                isGeneratingAnswer={generateAnswer.isPending}
                selected={selectedIds.has(question.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedIds(prev => new Set(prev).add(question.id));
                  } else {
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      next.delete(question.id);
                      return next;
                    });
                  }
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, questions.length)} of {questions.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === safePage ? 'default' : 'outline'}
                      size="icon"
                      className={cn('h-8 w-8 text-sm', p === safePage && 'pointer-events-none')}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {(moderateQuestion.isPending || bulkModerate.isPending) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <Badge className="text-sm gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            {bulkModerate.isPending ? `Updating ${selectedIds.size} exam papers...` : 'Updating exam paper...'}
          </Badge>
        </div>
      )}
    </div>
  );
}
