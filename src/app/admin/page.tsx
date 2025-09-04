'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Question } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Check, X, ExternalLink, Users, FileText, Clock, TrendingUp, AlertCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const { toast } = useToast();
  const router = useRouter();

  // Check admin authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminAuth = sessionStorage.getItem('adminAuthenticated');
      const email = sessionStorage.getItem('adminEmail');
      
      if (adminAuth === 'true' && email) {
        setIsAuthenticated(true);
        setAdminEmail(email);
      } else {
        // Redirect to admin login if not authenticated
        router.replace('/admin/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
    setAdminEmail('');
    router.push('/admin/login');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out of the admin dashboard.',
    });
  };

  const fetchAllQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data);
      
      // Calculate stats
      const total = data.length;
      const pending = data.filter((q: Question) => q.status === 'pending').length;
      const approved = data.filter((q: Question) => q.status === 'approved').length;
      const rejected = data.filter((q: Question) => q.status === 'rejected').length;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Failed to fetch questions for admin:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch questions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllQuestions();
    }
  }, [isAuthenticated]);

  const handleAction = async (questionId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/questions/${questionId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} question`);
      }

      toast({
        title: 'Success',
        description: `Question ${action}d successfully.`,
      });

      // Refresh the questions list
      fetchAllQuestions();
    } catch (error) {
      console.error(`Error ${action}ing question:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${action} question.`,
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage all past question submissions and monitor system activity.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">Logged in as</p>
            <p className="text-xs text-muted-foreground">{adminEmail}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Live on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Not suitable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={fetchAllQuestions}
            disabled={isLoading}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Link href="/">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Platform
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploader</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading questions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No questions found. Uploads will appear here for review.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      {question.title}
                    </TableCell>
                    <TableCell>{question.institution}</TableCell>
                    <TableCell>{question.course}</TableCell>
                    <TableCell>{question.year}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(question.status)}>
                        {question.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {question.uploaderId || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {question.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(question.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(question.id, 'reject')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {question.status === 'approved' && (
                          <Badge variant="outline" className="text-green-600">
                            Live
                          </Badge>
                        )}
                        {question.status === 'rejected' && (
                          <Badge variant="outline" className="text-red-600">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
