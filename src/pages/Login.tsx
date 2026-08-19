import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { LogoMark } from '@/components/common/Logo';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      navigate('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message || 'Invalid email or password.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
      <div className="relative w-full max-w-sm px-4">
        <LogoMark className="h-12 w-12 mx-auto mb-6" />
        <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="m@example.com" {...field} type="email" /></FormControl>
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
                      <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing In...' : 'Login'}</Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">Don&apos;t have an account? <Link to="/signup" className="underline">Sign up</Link></div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
