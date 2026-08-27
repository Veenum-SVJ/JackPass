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
            const hasAnswer = !!(question.answerGenerated || question.answer);
            if (totalMarks === 0) return null;
            const parts = question.marksScheme || [];
            return (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Marks Available: {totalMarks}
                  </span>
                  <span className={cn('text-xs font-medium', hasAnswer ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                    {hasAnswer ? 'Answer Available' : 'No Answer Yet'}
                  </span>
                </div>
                <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mb-2">
                  <div className={cn('h-2 rounded-full transition-all duration-500', hasAnswer ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-400 dark:bg-amber-500')} style={{ width: hasAnswer ? '100%' : '0%' }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {parts.map((q, i) => (
                    <div key={i} className="text-xs bg-white dark:bg-background border border-amber-200 dark:border-amber-700 rounded px-2 py-0.5">
                      Q{q.question}: {q.totalMarks}m
                    </div>
                  ))}
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
                      <div className="space-y-3">
                        {question.marksScheme.map((q, i) => {
                          const maxPartMarks = q.parts && q.parts.length > 0 ? Math.max(...q.parts.map(p => p.marks)) : q.totalMarks;
                          return (
                            <div key={i} className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Question {q.question}</p>
                                <span className="text-xs font-mono text-amber-600 dark:text-amber-400">{q.totalMarks} marks</span>
                              </div>
                              {q.parts && q.parts.length > 0 && (
                                <div className="space-y-1.5">
                                  {q.parts.map((p, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">{p.label}</span>
                                      <div className="flex-1 bg-amber-200 dark:bg-amber-800 rounded-full h-1.5">
                                        <div className="bg-amber-500 dark:bg-amber-400 h-1.5 rounded-full" style={{ width: `${(p.marks / maxPartMarks) * 100}%` }} />
                                      </div>
                                      <span className="text-xs text-muted-foreground w-12 text-right shrink-0">{p.marks}m {p.text && <span className="text-xs">— {p.text}</span>}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
