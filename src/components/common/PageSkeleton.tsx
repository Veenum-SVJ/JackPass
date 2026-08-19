import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full-page shimmer skeleton shown while a lazily-loaded route chunk downloads.
 * Mirrors the Home layout (hero → search → card grid) so the transition feels
 * like the page assembling itself rather than a blank screen.
 */
export default function PageSkeleton() {
  return (
    <div className="space-y-8 pb-24" role="status" aria-label="Loading page">
      {/* Hero block */}
      <div className="text-center px-4 py-14">
        <Skeleton className="h-9 w-64 mx-auto rounded-full" />
        <Skeleton className="h-9 w-56 mx-auto mt-6" />
        <Skeleton className="h-4 w-96 max-w-full mx-auto mt-4" />
      </div>

      {/* Search / filter card */}
      <div className="px-4">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Question grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
