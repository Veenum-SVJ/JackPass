import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, CheckCircle, BarChart2, BookOpen, MessageSquare, Award, Pencil } from 'lucide-react';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserUploads } from '@/hooks/useQuestions';

const initialUserStats = {
  uploads: 12,
  solved: 89,
  forumPosts: 5,
};

const badges = [
  { name: 'Top Contributor', icon: Award },
  { name: 'First Upload', icon: Upload },
  { name: 'Active Solver', icon: CheckCircle },
];

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(initialUserStats);
  const { data: userUploads = [], isLoading: isLoadingUploads } = useUserUploads(user?.id);

  useEffect(() => {
    // If not loading and no user, redirect to login.
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && isLoadingUploads === false && userUploads.length > 0) {
      // Sync the displayed upload count with real data
      setStats((prev) => ({ ...prev, uploads: userUploads.length }));
    }
  }, [user, loading, isLoadingUploads, userUploads]);

  if (loading || !user) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 text-center sm:text-left">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-12 w-full mt-2" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card><CardHeader><Skeleton className="h-32 w-full" /></CardHeader></Card>
          <Card><CardHeader><Skeleton className="h-32 w-full" /></CardHeader></Card>
          <Card><CardHeader><Skeleton className="h-32 w-full" /></CardHeader></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/15 to-transparent" />
        <CardContent className="relative p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProfilePictureUpload
            currentAvatar={user.user_metadata?.avatar || ''}
            onAvatarChange={(newAvatar) => updateUser({ avatar: newAvatar })}
            userName={user.user_metadata?.name || 'User'}
          />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold font-headline">{user.user_metadata?.name || 'User'}</h1>
            <p className="text-muted-foreground">{user.user_metadata?.university || 'University not set'}</p>
            <p className="text-sm text-muted-foreground">{user.user_metadata?.department || 'Department not set'} - {user.user_metadata?.level || 'N/A'} Level</p>
            <p className="mt-2 max-w-xl">{user.user_metadata?.bio || 'No bio provided'}</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <EditProfileDialog user={user.user_metadata || {}} onSave={updateUser} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Your activity on JackPass.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-full">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg font-headline">{stats.uploads}</p>
                    <p className="text-sm text-muted-foreground">Uploads Contributed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-full">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg font-headline">{stats.solved}</p>
                    <p className="text-sm text-muted-foreground">Questions Solved</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-full">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg font-headline">{stats.forumPosts}</p>
                    <p className="text-sm text-muted-foreground">Forum Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Your achievements.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {badges.map(badge => (
                  <div key={badge.name} className="flex flex-col items-center gap-2 text-center">
                    <div className="p-3 bg-accent/15 rounded-full">
                      <badge.icon className="h-8 w-8 text-amber-600 dark:text-accent" />
                    </div>
                    <p className="text-xs font-medium">{badge.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Contribution Rank</CardTitle>
                <CardDescription>Your rank in your university.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-full">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <p className="text-4xl font-bold font-headline">#12</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="uploads" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Uploads</CardTitle>
              <CardDescription>Past questions you've contributed to the community.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoadingUploads ? (
                <p>Loading your uploads...</p>
              ) : userUploads.length > 0 ? (
                userUploads.map(q => (
                  <div key={q.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{q.title}</h4>
                      <p className="text-sm text-muted-foreground">{q.institution} - {q.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${q.status === 'approved' ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-400/15' : q.status === 'pending' ? 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-400/15' : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-400/15'}`}>
                        {q.status}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/questions/${q.id}`)}>
                        <Pencil className="h-4 w-4 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p>You haven't uploaded any questions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Favorites & Saved</CardTitle>
              <CardDescription>Questions and courses you've saved for later.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>Feature coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
