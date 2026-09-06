import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { LogoMark } from '@/components/common/Logo';

export default function LoginPage() {
  useDocumentMeta('Login | JackPass', 'Sign in to your JackPass account to view and solve past questions.');
  const location = useLocation();

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
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account? <Link to="/signup" state={{ from }} className="underline">Sign up</Link>
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}