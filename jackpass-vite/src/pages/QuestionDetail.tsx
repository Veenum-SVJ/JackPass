import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import QuestionView from '@/components/questions/QuestionView';
import QuestionCard from '@/components/questions/QuestionCard';
import { useQuestion } from '@/hooks/useQuestions';
import { getRelatedQuestions } from '@/lib/data';
import type { Question } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: question, isLoading, isError } = useQuestion(id);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    setRelatedLoading(true);
    getRelatedQuestions(question)
      .then((related) => {
        if (!cancelled) setRelatedQuestions(related);
      })
      .catch(() => {
        if (!cancelled) setRelatedQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [question]);

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-4 pb-24">
        <div className="flex-grow lg:w-2/3 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !question) {
    return (
      <div className="relative overflow-hidden flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div className="relative">
          <h1 className="text-4xl font-bold font-headline">Question Not Found</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            The question you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-4 pb-24">
      <div className="flex-grow lg:w-2/3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all questions
        </Link>
        <QuestionView question={question} />
      </div>
      <aside className="lg:w-1/3 lg:sticky top-24 self-start">
        <h2 className="text-2xl font-bold mb-4 font-headline">Related Questions</h2>
        <div className="space-y-4">
          {relatedLoading ? (
            <Card>
              <CardContent className="py-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ) : (
            relatedQuestions.slice(0, 3).map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))
          )}
          {!relatedLoading && relatedQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground">No related questions found.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
