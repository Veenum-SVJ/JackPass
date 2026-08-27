import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface QuestionReviewCardProps {
  question: {
    id: string;
    title: string;
    institution: string;
    course: string;
    course_code?: string;
    year: number | string;
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
      page_count?: number;
      pages?: Array<{ page: number; url: string; fileName: string }>;
    };
  };
  onApprove: () => void;
  onReject: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function QuestionReviewCard({ question, onApprove, onReject, selected, onSelect }: QuestionReviewCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const statusColors = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300',
  };

  const typeColors = {
    Objective: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300',
    Theory: 'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300',
    Mixed: 'bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300',
  };

  const confidence = question.ai_extracted_data?.confidence;
  const pages = question.ai_extracted_data?.pages || [];
  const hasPages = pages.length > 0;

  return (
    <Card className={cn('flex flex-col transition-all', selected && 'ring-2 ring-primary')}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {onSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(!!checked)}
              className='mt-1'
            />
          )}
          <div className="flex items-start justify-between gap-2 flex-1">
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
              {question.ai_extracted_data?.page_count && question.ai_extracted_data.page_count > 1 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300">
                  <FileText className="h-3 w-3 mr-1" />
                  {question.ai_extracted_data.page_count} Pages
                </Badge>
              )}
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
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">{question.institution}</span>
            <span>•</span>
            <span>{question.course_code ? `${question.course_code} — ` : ''}{question.course}</span>
          </div>

          {/* Page Preview */}
          {hasPages && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-xs">
                  Exam Paper Preview ({currentPage + 1} of {pages.length})
                </p>
                {pages.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                      disabled={currentPage === pages.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative bg-muted rounded-lg overflow-hidden border">
                <img
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1} of exam paper`}
                  className="w-full h-auto object-contain max-h-[300px]"
                  loading="lazy"
                />
              </div>
              {pages.length > 1 && (
                <div className="flex gap-1 mt-2 justify-center">
                  {pages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        idx === currentPage ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasPages && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Content Preview</p>
              <p className="line-clamp-3 bg-muted/50 p-3 rounded text-sm">
                {question.content_preview || question.full_content?.slice(0, 300) + '...'}
              </p>
            </div>
          )}

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
              <p className="line-clamp-2 bg-indigo-50 border border-indigo-200 p-3 rounded text-sm dark:bg-indigo-400/10 dark:border-indigo-400/20">
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
        )}
        {question.status !== 'pending' && (
          <Button variant="outline" className="w-full sm:w-auto">
            Status: {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}