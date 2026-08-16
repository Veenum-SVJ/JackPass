## Task 1.8: Admin Question Approval Interface
Goal: Create an admin UI at `/admin/questions` to review pending questions, edit metadata, and approve/reject them.

### Files to Create/Modify
- Create: `src/app/admin/questions/page.tsx` — Main admin questions listing page
- Create: `src/app/admin/questions/[id]/page.tsx` — Question detail/edit page
- Create: `src/components/admin/QuestionReviewCard.tsx` — Card component for question review
- Modify: `src/app/api/admin/questions/route.ts` — Add PATCH for approve/reject
- Modify: `src/app/api/admin/questions/[id]/[action]/route.ts` — Handle approve/reject actions

### Exact Code to Write

```tsx
// src/app/admin/questions/page.tsx
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
  uploader_id: string;
  created_at: string;
  ai_extracted_data?: any;
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
```

```tsx
// src/components/admin/QuestionReviewCard.tsx
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Edit, Check, X, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface QuestionReviewCardProps {
  question: {
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
    answer?: string;
    explanation?: string;
    uploader_id: string;
    created_at: string;
    ai_extracted_data?: {
      confidence?: {
        overall: number;
        institution: number;
        course: number;
        year: number;
        semester: number;
        type: number;
      };
    };
  };
  onApprove: () => void;
  onReject: () => void;
}

export function QuestionReviewCard({ question, onApprove, onReject }: QuestionReviewCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const typeColors = {
    Objective: 'bg-blue-100 text-blue-800',
    Theory: 'bg-purple-100 text-purple-800',
    Mixed: 'bg-orange-100 text-orange-800',
  };

  const confidence = question.ai_extracted_data?.confidence;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">{question.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={cn(statusColors[question.status], 'text-xs')}>
                {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
              </Badge>
              <Badge variant="secondary" className={cn(typeColors[question.type as keyof typeof typeColors], 'text-xs')}>
                {question.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.year} • {question.semester} Semester
              </Badge>
            </div>
          </div>
          {confidence?.overall && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">AI Confidence</div>
              <div className={cn(
                'font-mono font-semibold',
                confidence.overall > 0.8 ? 'text-green-600' :
                confidence.overall > 0.6 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {Math.round(confidence.overall * 100)}%
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">{question.institution}</span>
            <span>•</span>
            <span>{question.course}</span>
          </div>
          
          <div>
            <p className="text-muted-foreground text-xs mb-1">Content Preview</p>
            <p className="line-clamp-3 bg-muted/50 p-3 rounded text-sm">
              {question.content_preview || question.full_content?.slice(0, 300) + '...'}
            </p>
          </div>

          {question.answer && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Answer (AI extracted)</p>
              <p className="line-clamp-2 bg-green-50 border border-green-200 p-3 rounded text-sm">
                {question.answer.slice(0, 200)}...
              </p>
            </div>
          )}

          {question.explanation && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Explanation</p>
              <p className="line-clamp-2 bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                {question.explanation.slice(0, 200)}...
              </p>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploaded: {format(new Date(question.created_at), 'MMM d, yyyy HH:mm')}</span>
            <span className="font-mono">{question.id.slice(0, 8)}...</span>
          </div>

          {question.ai_extracted_data && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                AI Confidence Details
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-2 text-muted-foreground">
                {Object.entries(question.ai_extracted_data.confidence || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}</span>
                    <span className="font-mono">{Math.round((value as number) * 100)}%</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-wrap gap-2 pt-4">
        {question.status === 'pending' && (
          <>
            <Button 
              variant="default" 
              onClick={onApprove}
              className="flex-1 sm:flex-none"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="destructive" 
              onClick={onReject}
              className="flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </>
        }
        {question.status !== 'pending' && (
          <Button variant="outline" className="w-full sm:w-auto">
            Status: {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

```typescript
// src/app/api/admin/questions/route.ts (update to support search/filter)
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    
    // Check if just requesting institutions list
    if (searchParams.get('institutions') === 'true') {
      const { data, error } = await supabase
        .from('questions')
        .select('institution')
        .order('institution');
      
      if (error) throw error;
      
      const uniqueInstitutions = [...new Set(data.map(q => q.institution))];
      return NextResponse.json(uniqueInstitutions);
    }

    // Build query with filters
    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const institution = searchParams.get('institution');

    if (search) {
      query = query.or(`title.ilike.%${search}%,institution.ilike.%${search}%,course.ilike.%${search}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (institution) {
      query = query.eq('institution', institution);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching admin questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/admin/questions/[id]/[action]/route.ts (update)
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params;
    const supabase = createServerSupabase();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('questions')
      .update({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: data,
      message: `Question ${action}d successfully`
    });
  } catch (error: any) {
    console.error(`Error ${action}ing question:`, error);
    return NextResponse.json(
      { error: error.message || `Failed to ${action} question` },
      { status: 500 }
    );
  }
}
```

### Commands to Run & Expected Output
```bash
# 1. Install date-fns if not present
npm install date-fns

# 2. Run typecheck and lint
npm run typecheck
npm run lint

# 3. Test admin interface
npm run dev
# Go to http://localhost:9002/admin/questions (need to be logged in as admin)
```

### Acceptance Criteria
- [ ] `/admin/questions` page lists all questions with filters (search, status, institution)
- [ ] Each question shows: title, institution, course, year/semester, type, status, content preview, answer, explanation
- [ ] AI confidence scores displayed with color coding
- [ ] Pending questions have Approve/Reject buttons
- [ ] Approve/Reject updates status and sets approved_at/approved_by
- [ ] After action, list refreshes automatically
- [ ] Filters work: search, status dropdown, institution dropdown
- [ ] TypeScript check passes
- [ ] Lint passes

### Git Commit Message
feat: add admin question approval interface with filtering and AI confidence display