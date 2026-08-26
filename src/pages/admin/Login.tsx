import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserSupabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (searchParams.get('error') === 'not_admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Your account does not have admin privileges.',
      });
    }
  }, [searchParams, toast]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);

      // signIn triggers onAuthStateChange which calls checkAdminStatus asynchronously.
      // We can't rely on the stale `isAdmin` closure value, so query the DB directly.
      const supabase = createBrowserSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No session after login');
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profile?.is_admin === true) {
        toast({
          title: 'Admin Login Successful!',
          description: 'Welcome to the admin panel.',
        });
        navigate('/admin');
      } else {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Your account does not have admin privileges.',
        });
        navigate('/admin/login?error=not_admin');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
          <CardDescription>Sign in with admin credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="admin@example.com" {...field} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} type={showPassword ? 'text' : 'password'} className="pr-10" />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Admin Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
