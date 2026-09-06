import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useForumPosts,
  useCreateForumPost,
  useToggleForumVote,
} from '@/hooks/useForum';
import { track } from '@/lib/analytics';
import { Search, ArrowUp, MessageSquare, MessagesSquare, GraduationCap, FileQuestion, Lightbulb, Users, Landmark, SearchX, RefreshCw } from 'lucide-react';
import FeedbackBoard from '@/components/feedback/FeedbackBoard';
import { Link } from 'react-router-dom';
import { institutions } from '@/lib/data';
import type { Course } from '@/lib/types';
import { CreatePostDialog } from '@/components/CreatePostDialog';
import { cn } from '@/lib/utils';

const discussionCategories = [
  { title: 'General Discussions', description: 'Talk about anything and everything.', icon: MessagesSquare },
  { title: 'Course Help', description: 'Get help with specific courses.', icon: GraduationCap },
  { title: 'Past Questions Requests', description: 'Request past questions from the community.', icon: FileQuestion },
  { title: 'Study Tips', description: 'Share and discover effective study strategies.', icon: Lightbulb },
  { title: 'Faculty Groups', description: 'Connect with students from your faculty.', icon: Users },
  { title: 'University-Specific Threads', description: 'Discussions for your specific university.', icon: Landmark },
];

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CommunityPage() {
  const { toast } = useToast();

  const { data: posts = [], isLoading, isError, refetch } = useForumPosts();
  const createPost = useCreateForumPost();
  const toggleVote = useToggleForumVote();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);

  const handleUniversityChange = (universityName: string) => {
    setSelectedUniversity(universityName);
    setSelectedCourse('');
    const institution = institutions.find(inst => inst.name === universityName);
    setCourses(institution ? institution.courses : []);
  };

  const filteredPosts = posts.filter(p => {
    if (searchTerm &&
        !p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedUniversity && p.university !== selectedUniversity) return false;
    if (selectedCourse && p.course !== selectedCourse) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    return true;
  });

  const handleCreatePost = async (data: { title: string; description: string; category: string; university?: string; course?: string }) => {
    try {
      await createPost.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category,
        university: data.university?.trim() || undefined,
        course: data.course?.trim() || undefined,
      });
      track('forum_post_created');
    } catch (error: any) {
      throw error;
    }
  };

  const handleVote = async (id: string) => {
    if (toggleVote.isPending) return;
    try {
      await toggleVote.mutateAsync(id);
      track('forum_upvote');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Vote failed', description: error.message });
    }
  };

  const toggleCategory = (title: string) => {
    setSelectedCategory(prev => (prev === title ? '' : title));
  };

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden text-center px-4 py-14 md:py-16 mb-8 rounded-b-3xl">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-5 font-headline">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Campus hub
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-headline">Student Community Forum</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Connect, Discuss, and Share Knowledge with Students Across Nigeria & Africa.</p>
        </div>
      </section>

      <div className="px-4">
        <Tabs defaultValue="discussions">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="feedback">Feedback Board</TabsTrigger>
          </TabsList>
          <TabsContent value="discussions">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9">
          <div className="bg-card p-4 rounded-lg border shadow-sm mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                <Input
                  placeholder="Search discussions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSearchTerm(searchInput); }}
                />
              </div>
              <Select value={selectedUniversity} onValueChange={handleUniversityChange}>
                <SelectTrigger><SelectValue placeholder="Filter by University" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Universities</SelectItem>
                  {institutions.map(inst => (
                    <SelectItem key={inst.name} value={inst.name}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedUniversity}>
                <SelectTrigger><SelectValue placeholder="Filter by Course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.name} value={course.name}>{course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={() => setSearchTerm(searchInput)}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-headline mb-4">Discussion Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discussionCategories.map(cat => {
                const active = selectedCategory === cat.title;
                return (
                <Card
                  key={cat.title}
                  onClick={() => toggleCategory(cat.title)}
                  className={cn(
                    'card-lift hover:border-primary cursor-pointer group',
                    active && 'border-primary ring-1 ring-primary bg-primary/5'
                  )}
                >
                  <CardHeader>
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary">{cat.title}</CardTitle>
                    <CardDescription>{cat.description}</CardDescription>
                  </CardHeader>
                </Card>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold font-headline">
                Recent Posts
                {selectedCategory && <span className="text-base font-medium text-primary ml-2">in {selectedCategory}</span>}
              </h2>
              <CreatePostDialog onPostCreate={handleCreatePost} />
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : isError && posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="bg-destructive/10 text-destructive p-3 rounded-full mb-4">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-headline">Couldn&apos;t Load Posts</CardTitle>
                  <CardDescription className="mt-2 max-w-md">
                    Something went wrong while fetching discussions. Please try again.
                  </CardDescription>
                  <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Card key={post.id} className="card-lift flex items-start gap-4 p-4">
                  <Button
                    variant={post.myVote ? 'default' : 'ghost'}
                    size="sm"
                    className="flex flex-col h-auto px-3 py-2 shrink-0"
                    onClick={() => handleVote(post.id)}
                    title={post.myVote ? 'Remove your vote' : 'Upvote this post'}
                  >
                    <ArrowUp className={cn('h-4 w-4', post.myVote && 'fill-current')} />
                    <span className="font-bold text-sm">{post.votes}</span>
                  </Button>
                  <div className='flex-1 min-w-0'>
                    <h3 className="font-bold text-lg text-primary">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-4 flex-wrap">
                      <span>Posted by <span className="font-medium text-foreground">{post.author}</span>{post.university ? ` (${post.university})` : ''}</span>
                      <span>{timeAgo(post.created_at)}</span>
                      {post.course && <span className="text-primary">{post.course}</span>}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.replies} replies
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredPosts.length === 0 && (
                <Card className="relative overflow-hidden">
                  <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
                  <CardContent className="relative py-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                      <SearchX className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-headline">No Posts Found</CardTitle>
                    <CardDescription className="mt-2 max-w-md">
                      No posts match your current filters. Try clearing them or creating a new post.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}
            </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-3 space-y-8 lg:sticky top-24 self-start">
          <Card>
            <CardHeader><CardTitle>Trending Posts</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li><Link to="#" className="text-primary hover:underline text-sm">Best way to combine school and work.</Link></li>
                <li><Link to="#" className="text-primary hover:underline text-sm">UNILAG vs OAU: Which is better for Engineering?</Link></li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><Link to="/upload" className="flex items-center text-sm hover:text-primary">Upload Portal</Link></li>
                <li><Link to="/support" className="flex items-center text-sm hover:text-primary">Support</Link></li>
                <li><Link to="#" className="flex items-center text-sm hover:text-primary">Rules & Guidelines</Link></li>
              </ul>
            </CardContent>
          </Card>
        </aside>
        </section>
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackBoard />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
