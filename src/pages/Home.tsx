import { useState, useMemo, useEffect } from 'react';
import SearchFilters from '@/components/questions/SearchFilters';
import type { SearchFilterState } from '@/components/questions/SearchFilters';
import QuestionCard from '@/components/questions/QuestionCard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, LifeBuoy, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestions } from '@/hooks/useQuestions';
import { useToast } from '@/hooks/use-toast';

const EMPTY_FILTERS: SearchFilterState = {
  institution: '',
  course: '',
  year: '',
  semester: '',
  type: '',
};

function HomePageContent() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilterState>(EMPTY_FILTERS);
  const { data: allQuestions, isLoading, isError } = useQuestions();

  const filteredQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return allQuestions.filter((q) => {
      if (appliedFilters.institution && q.institution !== appliedFilters.institution) return false;
      if (appliedFilters.course && !q.course.toLowerCase().includes(appliedFilters.course.toLowerCase())) return false;
      if (appliedFilters.year && q.year !== appliedFilters.year) return false;
      if (appliedFilters.semester && q.semester !== appliedFilters.semester) return false;
      if (appliedFilters.type && q.type !== appliedFilters.type) return false;
      return true;
    });
  }, [allQuestions, appliedFilters]);

  useEffect(() => {
    if (isError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch questions from the database.',
      });
    }
  }, [isError, toast]);

  return (
    <div className="space-y-8 pb-24">
      <section className="relative overflow-hidden text-center px-4 py-14 md:py-16 rounded-b-3xl mb-8">
        {/* Adire-inspired geometric pattern + soft indigo wash */}
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-5 font-headline">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            For Nigerian students, by students
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">
            Unlock Academic Success
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Search through thousands of official past questions from your institution and course. Ace your exams with JackPass.
          </p>
        </div>
      </section>

      <div className="sticky top-[65px] z-40 bg-background/80 backdrop-blur-sm -mt-8 rounded-lg">
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={() => setAppliedFilters(filters)}
        />
      </div>

      <section className="px-4">
        <h3 className="text-2xl font-bold mb-6 font-headline">All Questions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
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
                <CardFooter>
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          )}
        </div>
        {!isLoading && filteredQuestions.length === 0 && (
          <Card className="col-span-full relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
            <CardContent className="relative py-12 flex flex-col items-center justify-center text-center">
              <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                <SearchX className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-headline">No Questions Found</CardTitle>
              <CardDescription className="mt-2 max-w-md">
                We couldn't find any questions matching your filters. Try adjusting your search criteria or uploading a new past question to help the community.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="py-16 px-4">
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
            Community & Support
          </h3>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Join our vibrant community to connect with other students, share knowledge, and get help when you need it.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
          <Card className="card-lift flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-headline">Community Forum</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Engage in discussions, ask subject-specific questions, and collaborate with peers from your institution.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/community">Visit Forum</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="card-lift flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-headline">Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Facing a technical issue or have a suggestion? Our support team is here to help you out.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/support">Get Help</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return <HomePageContent />;
}
