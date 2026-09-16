import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { LogoMark } from '@/components/common/Logo';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Email/password sign-in for accounts created before OAuth was introduced.
 *
 * Google/Apple remain the recommended path — Supabase links an OAuth identity
 * to an existing user with the same email — but anyone whose sign-up address is
 * not a Google/Apple account (or whose email was never confirmed) can still
 * reach their existing account from here.
 */
function EmailPasswordForm({ from, onHide }: { from: string; onHide: () => void }) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast({ title: 'Login Successful!', description: 'Welcome back!' });
      navigate(from);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message || 'Invalid email or password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="m@example.com" {...field} type="email" autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Login'}
          </Button>
        </form>
      </Form>
      <button
        type="button"
        onClick={onHide}
        className="block w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Back to Google &amp; Apple sign-in
      </button>
    </div>
  );
}

export default function LoginPage() {
  useDocumentMeta('Login | JackPass', 'Sign in to your JackPass account to view and solve past questions.');
  const location = useLocation();
  const [showEmailForm, setShowEmailForm] = useState(false);

  // If the user was heading to a protected page, send them there after the
  // OAuth round-trip instead of the home page.
  const from = (location.state as { from?: string })?.from || '/';

  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
      <div className="relative w-full max-w-sm px-4">
        <LogoMark className="h-12 w-12 mx-auto mb-6" />
        <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Continue with Google or Apple — no passwords to remember.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons />
          {showEmailForm ? (
            <EmailPasswordForm from={from} onHide={() => setShowEmailForm(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="block w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Signed up with a password? Sign in with email
            </button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account? <Link to="/signup" state={{ from }} className="underline">Sign up</Link>
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}