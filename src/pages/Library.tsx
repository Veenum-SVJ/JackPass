import { useState, useMemo, useEffect } from 'react';
import type { SearchFilterState } from '@/components/questions/SearchFilters';
import QuestionCard from '@/components/questions/QuestionCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchX, BookOpen, Building2, GraduationCap, Search, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestions } from '@/hooks/useQuestions';
import { useToast } from '@/hooks/use-toast';
import { institutions } from '@/lib/institutions';

const EMPTY_FILTERS: SearchFilterState = {
  institution: '',
  course: '',
  year: '',
  semester: '',
  type: '',
};

const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

export default function Library() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<SearchFilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilterState>(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'browse' | 'results'>('browse');
  const { data: allQuestions, isLoading, isError } = useQuestions();

  const filteredQuestions = useMemo(() => {
    if (!allQuestions) return [];
    return allQuestions.filter((q) => {
      if (appliedFilters.institution && q.institution !== appliedFilters.institution) return false;
      if (appliedFilters.course && !q.course.toLowerCase().includes(appliedFilters.course.toLowerCase())) return false;
      if (appliedFilters.year && q.year !== appliedFilters.year) return false;
      if (appliedFilters.semester && q.semester !== appliedFilters.semester) return false;
      if (appliedFilters.type && q.type !== appliedFilters.type) return false;
      if (searchQuery) {
        const qLower = searchQuery.toLowerCase();
        const matchesTitle = q.title?.toLowerCase().includes(qLower);
        const matchesCourse = q.course?.toLowerCase().includes(qLower);
        const matchesInstitution = q.institution?.toLowerCase().includes(qLower);
        const matchesContent = q.contentPreview?.toLowerCase().includes(qLower);
        if (!matchesTitle && !matchesCourse && !matchesInstitution && !matchesContent) return false;
      }
      return true;
    });
  }, [allQuestions, appliedFilters, searchQuery]);

  // Get institutions that have exam papers
  const institutionsWithExamPapers = useMemo(() => {
    if (!allQuestions) return [];
    const counts = new Map<string, number>();
    allQuestions.forEach((q) => {
      counts.set(q.institution, (counts.get(q.institution) || 0) + 1);
    });
    return institutions
      .filter((inst) => counts.has(inst.name))
      .map((inst) => ({
        ...inst,
        examPaperCount: counts.get(inst.name) || 0,
      }))
      .sort((a, b) => b.examPaperCount - a.examPaperCount);
  }, [allQuestions]);

  // Get unique courses
  const coursesList = useMemo(() => {
    if (!allQuestions) return [];
    const courseSet = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.course) courseSet.add(q.course);
    });
    return Array.from(courseSet).sort();
  }, [allQuestions]);

  // Stats
  const stats = useMemo(() => {
    if (!allQuestions) return { total: 0, institutions: 0, courses: 0 };
    const instSet = new Set(allQuestions.map((q) => q.institution));
    const courseSet = new Set(allQuestions.map((q) => q.course));
    return {
      total: allQuestions.length,
      institutions: instSet.size,
      courses: courseSet.size,
    };
  }, [allQuestions]);

  useEffect(() => {
    if (isError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load the library.',
      });
    }
  }, [isError, toast]);

  const handleSearch = () => {
    setAppliedFilters(filters);
    setView('results');
  };

  const handleBrowseInstitution = (instName: string) => {
    setFilters({ ...EMPTY_FILTERS, institution: instName });
    setAppliedFilters({ ...EMPTY_FILTERS, institution: instName });
    setSearchQuery('');
    setView('results');
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSearchQuery('');
    setView('browse');
  };

  const hasActiveFilters = appliedFilters.institution || appliedFilters.course || appliedFilters.year || appliedFilters.semester || appliedFilters.type || searchQuery;

  return (
    <div className="space-y-8 pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden text-center px-4 py-14 md:py-16 rounded-b-3xl mb-8">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-5 font-headline">
            <BookOpen className="w-3.5 h-3.5" />
            Browse the archive
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tight">
            Library
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Explore our collection of past exam papers from institutions across Nigeria. Search by course, browse by institution, or filter by year and semester.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="flex flex-wrap justify-center gap-6 px-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-lg" />
          ))
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="font-semibold">{stats.total.toLocaleString()}</span>
              <span className="text-muted-foreground">Exam Papers</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-semibold">{stats.institutions.toLocaleString()}</span>
              <span className="text-muted-foreground">Institutions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <GraduationCap className="h-4 h-4" />
              </div>
              <span className="font-semibold">{stats.courses.toLocaleString()}</span>
              <span className="text-muted-foreground">Courses</span>
            </div>
          </>
        )}
      </div>

      {/* Quick Search */}
      <section className="px-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name, code, or keyword..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
              <Search className="mr-2 h-4 w-4" />
              Search Library
            </Button>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            <Select value={filters.institution} onValueChange={(v) => setFilters({ ...filters, institution: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Institution" />
              </SelectTrigger>
              <SelectContent>
                {institutionsWithExamPapers.map((inst) => (
                  <SelectItem key={inst.name} value={inst.name}>
                    {inst.name} ({inst.examPaperCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.course} onValueChange={(v) => setFilters({ ...filters, course: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                {coursesList.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.year} onValueChange={(v) => setFilters({ ...filters, year: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.semester} onValueChange={(v) => setFilters({ ...filters, semester: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First">First Semester</SelectItem>
                <SelectItem value="Second">Second Semester</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Objective">Objective</SelectItem>
                <SelectItem value="Theory">Theory</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {appliedFilters.institution && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setFilters({ ...filters, institution: '' }); setAppliedFilters({ ...appliedFilters, institution: '' }); }}>
                  {appliedFilters.institution} ×
                </Badge>
              )}
              {appliedFilters.course && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setFilters({ ...filters, course: '' }); setAppliedFilters({ ...appliedFilters, course: '' }); }}>
                  {appliedFilters.course} ×
                </Badge>
              )}
              {appliedFilters.year && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setFilters({ ...filters, year: '' }); setAppliedFilters({ ...appliedFilters, year: '' }); }}>
                  {appliedFilters.year} ×
                </Badge>
              )}
              {appliedFilters.semester && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setFilters({ ...filters, semester: '' }); setAppliedFilters({ ...appliedFilters, semester: '' }); }}>
                  {appliedFilters.semester} Semester ×
                </Badge>
              )}
              {appliedFilters.type && (
                <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setFilters({ ...filters, type: '' }); setAppliedFilters({ ...appliedFilters, type: '' }); }}>
                  {appliedFilters.type} ×
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleClearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Browse by Institution (shown when no active filters) */}
      {view === 'browse' && !hasActiveFilters && (
        <section className="px-4">
          <h3 className="text-2xl font-bold mb-2 font-headline">Browse by Institution</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Select an institution to see all available past exam papers.
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {institutionsWithExamPapers.map((inst) => (
                <Card
                  key={inst.name}
                  className="cursor-pointer hover:border-primary hover:bg-card/80 transition-all group"
                  onClick={() => handleBrowseInstitution(inst.name)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {inst.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inst.examPaperCount} exam paper{inst.examPaperCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {institutionsWithExamPapers.length === 0 && !isLoading && (
            <Card className="relative overflow-hidden">
              <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
              <CardContent className="relative py-12 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-headline">No Exam Papers Yet</CardTitle>
                <CardDescription className="mt-2 max-w-md">
                  No institutions have exam papers in the library yet. Be the first to upload a past exam paper!
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Search Results */}
      {(view === 'results' || hasActiveFilters) && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold font-headline">
                {appliedFilters.institution ? appliedFilters.institution : 'Search Results'}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {filteredQuestions.length} exam paper{filteredQuestions.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                ← Back to browse
              </Button>
            )}
          </div>

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
                  </CardContent>
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
                <CardTitle className="text-2xl font-headline">No Exam Papers Found</CardTitle>
                <CardDescription className="mt-2 max-w-md">
                  No exam papers match your filters. Try adjusting your search criteria or browse a different institution.
                </CardDescription>
                <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
