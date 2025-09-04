'use client';

import { useEffect, useState, useCallback } from 'react';
import SearchFilters from '@/components/SearchFilters';
import QuestionCard from '@/components/QuestionCard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, LifeBuoy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Question } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SearchFilterState {
  institution: string;
  course: string;
  year: string;
  semester: string;
  type: string;
}

function HomePageContent() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFilterState>({
    institution: '',
    course: '',
    year: '',
    semester: '',
    type: ''
  });

  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setAllQuestions(data);
      setFilteredQuestions(data); 
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch questions from the database.'
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const applyFilters = useCallback(() => {
    let newFilteredQuestions = [...allQuestions];

    if (filters.institution) {
      newFilteredQuestions = newFilteredQuestions.filter(q => q.institution === filters.institution);
    }
    if (filters.course) {
      newFilteredQuestions = newFilteredQuestions.filter(q => q.course.toLowerCase().includes(filters.course.toLowerCase()));
    }
    if (filters.year) {
      newFilteredQuestions = newFilteredQuestions.filter(q => q.year.toString() === filters.year);
    }
    if (filters.semester) {
      newFilteredQuestions = newFilteredQuestions.filter(q => q.semester === filters.semester);
    }
    if (filters.type) {
      newFilteredQuestions = newFilteredQuestions.filter(q => q.type === filters.type);
    }

    setFilteredQuestions(newFilteredQuestions);
  }, [filters, allQuestions]);


  return (
    <div className="space-y-8 pb-24">
       <section className="text-center p-8 rounded-b-3xl mb-8">
        <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">
          Unlock Academic Success
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Search through thousands of official past questions from your institution and course. Ace your exams with JackPass.
        </p>
      </section>

      <div className="sticky top-[65px] z-40 bg-background/80 backdrop-blur-sm -mt-8 rounded-lg">
        <SearchFilters filters={filters} onFiltersChange={setFilters} onSearch={applyFilters} />
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
            <Card className="col-span-full">
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
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
          <Card className="flex flex-col">
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
                <Link href="/community">Visit Forum</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex flex-col">
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
                <Link href="/support">Get Help</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}


export default function Home() {
  return (
    <HomePageContent />
  )
}
