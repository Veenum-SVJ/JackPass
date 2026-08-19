import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, BookOpen, MapPin, GraduationCap, Tag, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLecturer, useLecturerReviews, useLecturerQuestions } from '@/hooks/useLecturers';
import ReviewCard from '@/components/lecturers/ReviewCard';
import WriteReviewForm from '@/components/lecturers/WriteReviewForm';

export default function LecturerProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: lecturer, isLoading, isError } = useLecturer(id);
  const { data: reviews, isLoading: reviewsLoading } = useLecturerReviews(id);
  const { data: questions } = useLecturerQuestions(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-24 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !lecturer) {
    return (
      <div className="max-w-3xl mx-auto px-4 pb-24 text-center py-20">
        <h1 className="text-3xl font-bold font-headline">Lecturer Not Found</h1>
        <p className="text-muted-foreground mt-2">This lecturer profile doesn't exist or has been removed.</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const avgRating = Number(lecturer.rating_avg) || 0;
  const fullStars = Math.floor(avgRating);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-24">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to questions
      </Link>

      {/* ── Profile header (Wikipedia-style infobox) ───────────────────── */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Photo */}
            <div className="shrink-0">
              {lecturer.photo_url ? (
                <img
                  src={lecturer.photo_url}
                  alt={lecturer.name}
                  className="w-32 h-32 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center border">
                  <GraduationCap className="h-12 w-12 text-primary/40" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold font-headline">{lecturer.name}</h1>

              {/* Rating */}
              {lecturer.review_count > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= fullStars
                            ? 'fill-amber-500 text-amber-500'
                            : s - 0.5 <= avgRating
                            ? 'fill-amber-500/50 text-amber-500'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({lecturer.review_count} {lecturer.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {/* Info rows */}
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{lecturer.institution}</span>
                </div>
                {lecturer.faculty && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>{lecturer.faculty}</span>
                    {lecturer.department && <span>• {lecturer.department}</span>}
                  </div>
                )}
                {lecturer.country && (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 shrink-0 text-center">🌍</span>
                    <span>{lecturer.country}</span>
                  </div>
                )}
              </div>

              {/* Teaching style tags */}
              {lecturer.teaching_style && lecturer.teaching_style.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Tag className="h-3 w-3" />
                    Teaching style
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lecturer.teaching_style.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Known for */}
              {lecturer.known_for && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
                    <Info className="h-3 w-3" />
                    Known for
                  </div>
                  <p className="text-sm text-muted-foreground">{lecturer.known_for}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Courses taught ─────────────────────────────────────────────── */}
      {lecturer.courses && lecturer.courses.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Courses Taught
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lecturer.courses.map((course) => (
                <Badge key={course} variant="outline" className="text-sm">
                  {course}
                </Badge>
              ))}
            </div>
            {lecturer.questionCount !== undefined && (
              <p className="text-sm text-muted-foreground mt-3">
                {lecturer.questionCount} question{lecturer.questionCount !== 1 ? 's' : ''} on JackPass
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold font-headline mb-4">
          Reviews ({reviews?.length ?? 0})
        </h2>

        {/* Write review form */}
        <div className="mb-6">
          <WriteReviewForm lecturerId={lecturer.id} />
        </div>

        {/* Reviews list */}
        {reviewsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Questions by this lecturer ─────────────────────────────────── */}
      {Array.isArray(questions) && questions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-headline mb-4">
            Questions ({questions.length})
          </h2>
          <div className="space-y-3">
            {questions.map((q: Record<string, unknown>) => (
              <Link
                key={String(q.id)}
                to={`/questions/${String(q.id)}`}
                className="block p-4 rounded-lg border bg-card hover:shadow-md transition-all"
              >
                <h3 className="font-medium font-headline">{String(q.title)}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {String(q.course)} • {String(q.year)} • {String(q.semester)} Semester
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
