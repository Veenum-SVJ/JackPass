import { useState } from 'react';
import type { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft, ArrowRight, Lightbulb, ExternalLink, GraduationCap, Star, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function QuestionView({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);

  // Prev/next navigation only makes sense for numeric legacy ids.
  // New questions use UUIDs, so hide the controls in that case.
  const numericId = /^\d+$/.test(question.id) ? parseInt(question.id, 10) : null;
  const prevId = numericId !== null && numericId > 1 ? (numericId - 1).toString() : null;
  const nextId = numericId !== null ? (numericId + 1).toString() : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl lg:text-3xl font-headline">{question.title}</CardTitle>
              <div className="text-sm text-muted-foreground pt-2 space-y-1">
                <p>{question.institution} - {question.course}</p>
                <p>{question.year} &bull; {question.semester} Semester</p>
                {/* Lecturer chip — visible on hover, expands on click */}
                {question.lecturer && (
                  <LecturerChip lecturer={question.lecturer} />
                )}
              </div>
            </div>
            {question.fileUrl && (
              <Button asChild variant="outline" className="shrink-0">
                <a href={question.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Document
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg dark:prose-invert max-w-none font-body">
            <p className="whitespace-pre-wrap">{question.fullContent}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Lightbulb className="text-amber-600 dark:text-accent" />
            Answer & Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalMarks = question.marksScheme?.reduce((sum, q) => sum + (q.totalMarks || 0), 0) || 0;
            const answerText = (question.answerGenerated || question.answer || '').toLowerCase();
            if (totalMarks === 0) return null;
            const parts = question.marksScheme || [];
            // Calculate total covered marks across all questions
            let totalCovered = 0;
            for (const q of parts) {
              for (const p of (q.parts || [])) {
                const label = p.label.toLowerCase().replace(/[()]/g, '');
                if (answerText.includes(label)) totalCovered += p.marks;
              }
            }
            const allCovered = totalCovered >= totalMarks;
            const someCovered = totalCovered > 0 && !allCovered;

            return (
              <div className={cn('mb-4 p-3 border rounded-lg', allCovered ? 'bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20' : someCovered ? 'bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20' : 'bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20')}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs font-medium flex items-center gap-1', allCovered ? 'text-emerald-800 dark:text-emerald-300' : someCovered ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300')}>
                    <BookOpen className="h-3 w-3" /> Marks Available: {totalMarks}
                  </span>
                  <span className={cn('text-xs font-medium', allCovered ? 'text-emerald-600 dark:text-emerald-400' : someCovered ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')}>
                    {allCovered ? 'Fully Answered' : someCovered ? `${totalCovered}/${totalMarks} marks covered` : 'No Answer Yet'}
                  </span>
                </div>
                <div className={cn('w-full rounded-full h-2 mb-2', allCovered ? 'bg-emerald-200 dark:bg-emerald-800' : someCovered ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-red-200 dark:bg-red-800')}>
                  <div className={cn('h-2 rounded-full transition-all duration-500', allCovered ? 'bg-emerald-500 dark:bg-emerald-400' : someCovered ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-400 dark:bg-red-500')} style={{ width: `${totalMarks > 0 ? (totalCovered / totalMarks) * 100 : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {parts.map((q, i) => {
                    const qCovered = (q.parts || []).reduce((sum, p) => {
                      const label = p.label.toLowerCase().replace(/[()]/g, '');
                      return sum + (answerText.includes(label) ? p.marks : 0);
                    }, 0);
                    const qAll = qCovered >= q.totalMarks;
                    const qSome = qCovered > 0 && !qAll;
                    return (
                      <div key={i} className={cn('text-xs border rounded px-2 py-0.5', qAll ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300' : qSome ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300')}>
                        Q{q.question}: {qCovered}/{q.totalMarks}m
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          <Button onClick={() => setShowAnswer(!showAnswer)} variant="outline" className="mb-4">
            {showAnswer ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Button>
          {showAnswer && (
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg space-y-4 animate-in fade-in-50">
              {question.answer || question.answerGenerated || question.explanation ? (
                <>
                  {question.answerGenerated && (
                    <div>
                      <h4 className="font-bold font-headline">Model Answer:</h4>
                      <p className="font-code text-primary whitespace-pre-wrap">{question.answerGenerated}</p>
                    </div>
                  )}
                  {!question.answerGenerated && question.answer && (
                    <div>
                      <h4 className="font-bold font-headline">Answer:</h4>
                      <p className="font-code text-primary whitespace-pre-wrap">{question.answer}</p>
                    </div>
                  )}
                  {question.explanation && (
                    <div>
                      <h4 className="font-bold font-headline mt-2">Explanation:</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{question.explanation}</p>
                    </div>
                  )}
                  {question.marksScheme && question.marksScheme.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="font-bold font-headline mb-2">Marks Allocation:</h4>
                      {(() => {
                        const answerText = (question.answerGenerated || question.answer || '').toLowerCase();
                        return (
                          <div className="space-y-3">
                            {question.marksScheme.map((q, i) => {
                              const parts = q.parts || [];
                              const coveredParts = parts.filter(p => {
                                const label = p.label.toLowerCase().replace(/[()]/g, '');
                                return answerText.includes(label.toLowerCase());
                              });
                              const coveredMarks = coveredParts.reduce((sum, p) => sum + p.marks, 0);
                              const isFullyCovered = coveredMarks >= q.totalMarks;
                              const isPartial = coveredMarks > 0 && !isFullyCovered;
                              return (
                                <div key={i} className={cn('border rounded p-3', isFullyCovered ? 'bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20' : isPartial ? 'bg-yellow-50 dark:bg-yellow-400/10 border-yellow-200 dark:border-yellow-400/20' : 'bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20')}>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className={cn('font-semibold text-sm', isFullyCovered ? 'text-emerald-800 dark:text-emerald-300' : isPartial ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300')}>Question {q.question}</p>
                                    <span className={cn('text-xs font-mono', isFullyCovered ? 'text-emerald-600 dark:text-emerald-400' : isPartial ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')}>{coveredMarks}/{q.totalMarks} marks</span>
                                  </div>
                                  {/* Overall question progress bar */}
                                  <div className="w-full bg-border rounded-full h-1.5 mb-2">
                                    <div className={cn('h-1.5 rounded-full transition-all duration-500', isFullyCovered ? 'bg-emerald-500 dark:bg-emerald-400' : isPartial ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-red-400 dark:bg-red-500')} style={{ width: `${q.totalMarks > 0 ? (coveredMarks / q.totalMarks) * 100 : 0}%` }} />
                                  </div>
                                  {parts.length > 0 && (
                                    <div className="space-y-1.5">
                                      {parts.map((p, j) => {
                                        const label = p.label.toLowerCase().replace(/[()]/g, '');
                                        const partCovered = answerText.includes(label.toLowerCase());
                                        return (
                                          <div key={j} className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">{p.label}</span>
                                            <div className="flex-1 bg-border rounded-full h-1.5">
                                              <div className={cn('h-1.5 rounded-full transition-all duration-500', partCovered ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-400 dark:bg-red-500')} style={{ width: partCovered ? '100%' : '0%' }} />
                                            </div>
                                            <span className={cn('text-xs w-20 text-right shrink-0', partCovered ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-500 dark:text-red-400')}>{p.marks}m {partCovered ? '✓' : '✗'}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No answer or explanation available for this question yet.</p>
              )}
            </div>
          )}
        </CardContent>
        {(prevId || nextId) && (
          <CardFooter className="flex justify-between border-t pt-6">
            {prevId ? <Button asChild variant="ghost"><Link to={`/questions/${prevId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Link></Button> : <div />}
            {nextId ? <Button asChild variant="ghost"><Link to={`/questions/${nextId}`}>Next <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <div />}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

/**
 * A subtle chip that appears on hover and expands to show lecturer info.
 * Links to the full lecturer profile on click.
 */
function LecturerChip({
  lecturer,
}: {
  lecturer: { id: string; name: string; ratingAvg?: number; reviewCount?: number; photoUrl?: string };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group/lecturer inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        {lecturer.photoUrl ? (
          <img src={lecturer.photoUrl} alt="" className="h-4 w-4 rounded-full object-cover opacity-60 group-hover/lecturer:opacity-100 transition-opacity" />
        ) : (
          <GraduationCap className="h-3.5 w-3.5 opacity-50 group-hover/lecturer:opacity-100 transition-opacity" />
        )}
        <span className="opacity-60 group-hover/lecturer:opacity-100 transition-opacity">Set by</span>
        <span className="font-medium opacity-70 group-hover/lecturer:opacity-100 transition-opacity">
          {lecturer.name}
        </span>
        {lecturer.ratingAvg !== undefined && lecturer.ratingAvg > 0 && (
          <span className="inline-flex items-center gap-0.5 opacity-50 group-hover/lecturer:opacity-100 transition-opacity">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>{Number(lecturer.ratingAvg).toFixed(1)}</span>
          </span>
        )}
      </button>

      {/* Expanded card on click */}
      {expanded && (
        <div className="mt-2 p-3 rounded-lg border bg-card shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            {lecturer.photoUrl ? (
              <img src={lecturer.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary/60" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{lecturer.name}</p>
              {lecturer.ratingAvg !== undefined && lecturer.ratingAvg > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span>{Number(lecturer.ratingAvg).toFixed(1)}</span>
                  {lecturer.reviewCount !== undefined && (
                    <span>• {lecturer.reviewCount} reviews</span>
                  )}
                </div>
              )}
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link to={`/lecturer/${lecturer.id}`}>View profile</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
