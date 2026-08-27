import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Check, X, FileText, ChevronLeft, ChevronRight, Edit3, Save, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
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
    file_url?: string;
    file_name?: string;
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
      pages?: Array<{ page: number; url: string; fileName: string; uploadId: string }>;
    };
  };
  onApprove: () => void;
  onReject: () => void;
  onSave?: (updates: Record<string, unknown>) => void;
  onReprocess?: () => void;
  isReprocessing?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function QuestionReviewCard({ question, onApprove, onReject, onSave, onReprocess, isReprocessing, selected, onSelect }: QuestionReviewCardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: question.title,
    institution: question.institution,
    course: question.course,
    course_code: question.course_code || '',
    year: String(question.year),
    semester: question.semester,
    type: question.type,
    content_preview: question.content_preview,
    full_content: question.full_content,
    answer: question.answer || '',
    explanation: question.explanation || '',
  });
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
  const hasFileUrl = !!question.file_url;

  const handleSave = () => {
    onSave?.(editData);
    setIsEditing(false);
  };

  const isMockOcr = question.content_preview?.startsWith('[MOCK OCR]') || question.full_content?.startsWith('[MOCK OCR]');

  const handleCancel = () => {
    setEditData({
      title: question.title,
      institution: question.institution,
      course: question.course,
      course_code: question.course_code || '',
      year: String(question.year),
      semester: question.semester,
      type: question.type,
      content_preview: question.content_preview,
      full_content: question.full_content,
      answer: question.answer || '',
      explanation: question.explanation || '',
    });
    setIsEditing(false);
  };

  return (
    <Card className={cn('flex flex-col transition-all', selected && 'ring-2 ring-primary')}>
      <CardHeader className="pb-2">
        {isMockOcr && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Mock OCR — Fake Content</p>
              <p className="text-xs mt-1">This exam paper was not processed by a real OCR engine. The extracted text is placeholder content and does not reflect the actual uploaded file. Click "Re-process" to run Gemini Vision OCR on the original image.</p>
            </div>
          </div>
        )}
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
              {isEditing ? (
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-lg font-semibold"
                  placeholder="Title"
                />
              ) : (
                <CardTitle className="text-lg font-semibold truncate">{question.title}</CardTitle>
              )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={cn(statusColors[question.status], 'text-xs')}>
                {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
              </Badge>
              {isEditing ? (
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="text-xs rounded border px-2 py-0.5"
                  >
                    <option value="Objective">Objective</option>
                    <option value="Theory">Theory</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                ) : (
                  <Badge variant="secondary" className={cn(typeColors[question.type as keyof typeof typeColors], 'text-xs')}>
                    {question.type}
                  </Badge>
                )}
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
            <div className="flex items-start gap-2">
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
              {onReprocess && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReprocess}
                  disabled={isReprocessing}
                  title="Re-run OCR on the original image"
                >
                  <RefreshCw className={cn('h-4 w-4 mr-1', isReprocessing && 'animate-spin')} />
                  {isReprocessing ? 'Processing...' : 'Re-process'}
                </Button>
              )}
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              >
                {isEditing ? <X className="h-4 w-4 mr-1" /> : <Edit3 className="h-4 w-4 mr-1" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {isEditing ? (
          /* -- EDIT MODE -- */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Institution</label>
                <Input value={editData.institution} onChange={(e) => setEditData({ ...editData, institution: e.target.value })} placeholder="Institution" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Course Code</label>
                <Input value={editData.course_code} onChange={(e) => setEditData({ ...editData, course_code: e.target.value })} placeholder="e.g. CSC 301" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Course Name</label>
                <Input value={editData.course} onChange={(e) => setEditData({ ...editData, course: e.target.value })} placeholder="Course name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Year / Semester</label>
                <div className="flex gap-2">
                  <Input value={editData.year} onChange={(e) => setEditData({ ...editData, year: e.target.value })} placeholder="2025/2026" />
                  <select value={editData.semester} onChange={(e) => setEditData({ ...editData, semester: e.target.value })} className="rounded border px-2 text-sm">
                    <option value="First">First</option>
                    <option value="Second">Second</option>
                  </select>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Content Preview (first 200-300 chars)</label>
              <Textarea value={editData.content_preview} onChange={(e) => setEditData({ ...editData, content_preview: e.target.value })} className="min-h-[80px] text-sm" placeholder="Short preview..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Content (complete exam paper text)</label>
              <Textarea value={editData.full_content} onChange={(e) => setEditData({ ...editData, full_content: e.target.value })} className="min-h-[200px] text-sm" placeholder="Full extracted text..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Answer / Solution</label>
              <Textarea value={editData.answer} onChange={(e) => setEditData({ ...editData, answer: e.target.value })} className="min-h-[80px] text-sm" placeholder="Model answer..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Explanation / Marking Scheme</label>
              <Textarea value={editData.explanation} onChange={(e) => setEditData({ ...editData, explanation: e.target.value })} className="min-h-[80px] text-sm" placeholder="Marking scheme..." />
            </div>
            <Button onClick={handleSave} className="w-full"><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
          </div>
        ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">{question.institution}</span>
            <span>•</span>
            <span>{question.course_code ? `${question.course_code} — ` : ''}{question.course}</span>
          </div>

          {/* Side-by-side: Original Image + Extracted Content */}
          {(hasPages || hasFileUrl) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="relative">
                <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Original Exam Paper {hasPages ? `(${currentPage + 1} of ${pages.length})` : ''}
                </p>
                <div className="relative bg-muted rounded-lg overflow-hidden border">
                  {hasPages ? (
                    <>
                      <img src={pages[currentPage]?.url} alt={`Page ${currentPage + 1} of exam paper`} className="w-full h-auto object-contain max-h-[400px]" loading="lazy" />
                      {pages.length > 1 && (
                        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}><ChevronLeft className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 hover:bg-background" onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage === pages.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </>
                  ) : question.file_url ? (
                    <img src={question.file_url} alt="Original exam paper" className="w-full h-auto object-contain max-h-[400px]" loading="lazy" />
                  ) : null}
                </div>
                {hasPages && pages.length > 1 && (
                  <div className="flex gap-1 mt-2 justify-center">
                    {pages.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentPage(idx)} className={cn('w-2 h-2 rounded-full transition-colors', idx === currentPage ? 'bg-primary' : 'bg-muted-foreground/30')} aria-label={`Go to page ${idx + 1}`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-2">AI-Extracted Content (compare with image on left)</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Content Preview</p>
                    <p className="bg-muted/50 p-3 rounded text-sm max-h-[150px] overflow-y-auto">{question.content_preview || 'No preview extracted'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Full Content</p>
                    <p className="bg-muted/50 p-3 rounded text-sm max-h-[200px] overflow-y-auto whitespace-pre-wrap">{question.full_content || 'No content extracted'}</p>
                  </div>
                  {question.answer && (<div><p className="text-xs text-muted-foreground mb-0.5">Answer (AI extracted)</p><p className="bg-green-50 border border-green-200 p-3 rounded text-sm dark:bg-green-400/10 dark:border-green-400/20 max-h-[150px] overflow-y-auto">{question.answer}</p></div>)}
                  {question.explanation && (<div><p className="text-xs text-muted-foreground mb-0.5">Explanation</p><p className="bg-indigo-50 border border-indigo-200 p-3 rounded text-sm dark:bg-indigo-400/10 dark:border-indigo-400/20 max-h-[150px] overflow-y-auto">{question.explanation}</p></div>)}
                </div>
              </div>
            </div>
          )}

          {!hasPages && !hasFileUrl && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Content Preview</p>
              <p className="line-clamp-3 bg-muted/50 p-3 rounded text-sm">
                {question.content_preview || question.full_content?.slice(0, 300) + '...'}
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
        )}
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