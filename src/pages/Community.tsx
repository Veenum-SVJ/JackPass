import { useState, useEffect } from 'react';
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
import { Search, ArrowUp, ArrowDown, MessageSquare, MessagesSquare, GraduationCap, FileQuestion, Lightbulb, Users, Landmark, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { institutions } from '@/lib/data';
import type { Course } from '@/lib/types';
import { CreatePostDialog } from '@/components/CreatePostDialog';

const discussionCategories = [
  { title: 'General Discussions', description: 'Talk about anything and everything.', icon: MessagesSquare },
  { title: 'Course Help', description: 'Get help with specific courses.', icon: GraduationCap },
  { title: 'Past Questions Requests', description: 'Request past questions from the community.', icon: FileQuestion },
  { title: 'Study Tips', description: 'Share and discover effective study strategies.', icon: Lightbulb },
  { title: 'Faculty Groups', description: 'Connect with students from your faculty.', icon: Users },
  { title: 'University-Specific Threads', description: 'Discussions for your specific university.', icon: Landmark },
];

interface Post {
  id: number;
  title: string;
  description: string;
  author: string;
  university: string;
  course: string;
  replies: number;
  votes: number;
  date: string;
}

const initialPosts: Post[] = [
  {
    id: 1,
    title: 'Anyone have the MTH 101 past questions from 2022?',
    description: "I've been searching everywhere for the 2022 MTH 101 past questions for University of Lagos. Can anyone help me out?",
    author: 'John Doe',
    university: 'University of Lagos',
    course: 'MTH 101',
    replies: 5,
    votes: 12,
    date: '2 hours ago',
  },
  {
    id: 2,
    title: 'Struggling with CSC 404 (Advanced Algorithms)',
    description: 'This course is killing me. Does anyone have any tips or resources for the final exams? Specifically for the topic on dynamic programming.',
    author: 'Jane Smith',
    university: 'Ahmadu Bello University',
    course: 'CSC 404',
    replies: 12,
    votes: 25,
    date: '1 day ago',
  },
  {
    id: 3,
    title: 'Study group for LAW 211 (Law of Contract)',
    description: 'Looking to form a study group for the upcoming Law of Contract exams. We can meet online or in person. Let me know if you are interested.',
    author: 'Bisi Adebayo',
    university: 'Obafemi Awolowo University',
    course: 'LAW 211',
    replies: 8,
    votes: 15,
    date: '3 days ago',
  },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);

  const handleUniversityChange = (universityName: string) => {
    setSelectedUniversity(universityName);
    setSelectedCourse('');
    const institution = institutions.find(inst => inst.name === universityName);
    setCourses(institution ? institution.courses : []);
  };

  useEffect(() => {
    let newFilteredPosts = [...posts];

    if (searchTerm) {
      newFilteredPosts = newFilteredPosts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedUniversity) {
      newFilteredPosts = newFilteredPosts.filter(p => p.university === selectedUniversity);
    }

    if (selectedCourse) {
      newFilteredPosts = newFilteredPosts.filter(p => p.course === selectedCourse);
    }

    setFilteredPosts(newFilteredPosts);
  }, [searchTerm, selectedUniversity, selectedCourse, posts]);

  const handleCreatePost = (newPost: { title: string; description: string }) => {
    const post: Post = {
      id: posts.length + 1,
      ...newPost,
      author: 'Bello Akim', // Logged in user
      university: 'University of Lagos', // Logged in user's university
      course: 'GNS 101',
      replies: 0,
      votes: 0,
      date: 'Just now',
    };
    setPosts([post, ...posts]);
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

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        <div className="lg:col-span-9">
          <div className="bg-card p-4 rounded-lg border shadow-sm mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-headline mb-4">Discussion Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discussionCategories.map(cat => (
                <Card key={cat.title} className="card-lift hover:border-primary cursor-pointer group">
                  <CardHeader>
                    <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mb-3">
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary">{cat.title}</CardTitle>
                    <CardDescription>{cat.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold font-headline">Recent Posts</h2>
              <CreatePostDialog onPostCreate={handleCreatePost} />
            </div>

            <div className="space-y-4">
              {filteredPosts.map(post => (
                <Card key={post.id} className="card-lift flex items-start gap-4 p-4">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowUp /></Button>
                    <span className="font-bold text-sm">{post.votes}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowDown /></Button>
                  </div>
                  <div className='flex-1'>
                    <h3 className="font-bold text-lg text-primary">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-4 flex-wrap">
                      <span>Posted by <span className="font-medium text-foreground">{post.author}</span> ({post.university})</span>
                      <span>{post.date}</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.replies} replies</span>
                      </div>
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
    </div>
  );
}
