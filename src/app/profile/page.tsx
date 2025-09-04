'use client'

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Star, CheckCircle, BarChart2, BookOpen, MessageSquare, Award, User as UserIcon } from 'lucide-react';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import type { Question } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


const initialUserStats = {
    uploads: 12,
    solved: 89,
    forumPosts: 5,
};

const badges = [
    { name: 'Top Contributor', icon: Award },
    { name: 'First Upload', icon: Upload },
    { name: 'Active Solver', icon: CheckCircle }
];


export default function ProfilePage() {
    const { user, loading, updateUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [stats] = useState(initialUserStats);
    const [userUploads, setUserUploads] = useState<Question[]>([]);
    const [isLoadingUploads, setIsLoadingUploads] = useState(true);

    useEffect(() => {
        // If not loading and no user, redirect to login.
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // This is a placeholder for fetching user-specific uploads
    useEffect(() => {
        const fetchUploads = async () => {
          if (!user?.email) return; // We'll use email as a mock user ID
          setIsLoadingUploads(true);
          try {
            // Fetch from the new API route
            const response = await fetch(`/api/users/${user.email}/uploads`);
            if (!response.ok) {
                throw new Error('Failed to fetch user uploads');
            }
            const uploads = await response.json();
            setUserUploads(uploads);
          } catch (error) {
            console.error("Failed to fetch user uploads:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: "Could not fetch your uploads."
            })
          } finally {
            setIsLoadingUploads(false);
          }
        };

        if (user) {
            fetchUploads();
        }
      }, [user, toast]);


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
        )
    }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <ProfilePictureUpload
                currentAvatar={user.avatar || ''}
                onAvatarChange={(newAvatar) => updateUser({ avatar: newAvatar })}
                userName={user.name}
            />
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                <p className="text-muted-foreground">{user.university}</p>
                <p className="text-sm text-muted-foreground">{user.department} - {user.level} Level</p>
                <p className="mt-2 max-w-xl">{user.bio}</p>
            </div>
            <div className="ml-auto hidden sm:block">
              <EditProfileDialog user={user} onSave={updateUser} />
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
                            <Upload className="text-primary"/>
                            <div>
                                <p className="font-bold text-lg">{stats.uploads}</p>
                                <p className="text-sm text-muted-foreground">Uploads Contributed</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <BookOpen className="text-primary"/>
                            <div>
                                <p className="font-bold text-lg">{stats.solved}</p>
                                <p className="text-sm text-muted-foreground">Questions Solved</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <MessageSquare className="text-primary"/>
                            <div>
                                <p className="font-bold text-lg">{stats.forumPosts}</p>
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
                                <div className="p-3 bg-muted rounded-full">
                                    <badge.icon className="h-8 w-8 text-accent"/>
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
                             <BarChart2 className="h-10 w-10 text-primary" />
                             <p className="text-4xl font-bold">#12</p>
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
                                     <span className={`text-xs font-medium px-2 py-1 rounded-full ${q.status === 'approved' ? 'text-green-700 bg-green-100' : q.status === 'pending' ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100'}`}>
                                        {q.status}
                                    </span>
                                     <Button variant="outline" size="sm">Edit</Button>
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
