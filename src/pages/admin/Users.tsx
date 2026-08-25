import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, Shield, ShieldOff, Users as UsersIcon, Mail, Clock } from 'lucide-react';
import {
  useAdminUsers,
  usePromoteUser,
  useDemoteUser,
} from '@/hooks/useAdminUsers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: users = [], isLoading } = useAdminUsers(debouncedSearch);
  const promoteUser = usePromoteUser();
  const demoteUser = useDemoteUser();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePromote = async (userId: string, userName: string) => {
    try {
      await promoteUser.mutateAsync(userId);
      toast({
        title: 'User Promoted',
        description: `${userName} now has admin privileges.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Promotion Failed',
        description: error.message || 'Could not promote user.',
      });
    }
  };

  const handleDemote = async (userId: string, userName: string) => {
    try {
      await demoteUser.mutateAsync(userId);
      toast({
        title: 'Admin Removed',
        description: `${userName} no longer has admin privileges.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Demotion Failed',
        description: error.message || 'Could not demote user.',
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const adminCount = users.filter((u) => u.is_admin).length;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-3 font-headline">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                User Management
              </span>
              <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
                Users
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Manage user accounts and admin privileges.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm gap-1.5">
                <UsersIcon className="h-3.5 w-3.5" />
                {users.length} Users
              </Badge>
              <Badge variant="default" className="text-sm gap-1.5 bg-primary">
                <Shield className="h-3.5 w-3.5" />
                {adminCount} Admins
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full animate-pulse bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-3 w-48 animate-pulse bg-muted rounded" />
                  </div>
                  <div className="h-8 w-20 animate-pulse bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-adire text-primary/5" />
          <CardContent className="relative py-12 text-center">
            <div className="bg-primary/10 text-primary p-3 rounded-full mx-auto mb-4 w-fit">
              <UsersIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold font-headline mb-2">No Users Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {search ? 'No users match your search.' : 'No users have registered yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUser?.id;
            return (
              <Card key={user.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} alt={user.name || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-headline truncate">
                          {user.name || 'Unnamed User'}
                        </span>
                        {user.is_admin && (
                          <Badge variant="default" className="text-xs gap-1 bg-primary">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </span>
                        {user.last_sign_in && (
                          <span className="hidden sm:flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Last login: {format(new Date(user.last_sign_in), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isCurrentUser && (
                        user.is_admin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDemote(user.id, user.name || 'User')}
                            disabled={demoteUser.isPending}
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {demoteUser.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ShieldOff className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Remove Admin</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromote(user.id, user.name || 'User')}
                            disabled={promoteUser.isPending}
                            className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            {promoteUser.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Shield className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Make Admin</span>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
