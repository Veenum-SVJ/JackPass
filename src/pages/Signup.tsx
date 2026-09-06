import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { LogoMark } from '@/components/common/Logo';

export default function SignupPage() {
  useDocumentMeta('Create Account | JackPass', 'Create a free JackPass account to access past questions from Nigerian universities.');
  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
      <div className="relative w-full max-w-sm px-4">
        <LogoMark className="h-12 w-12 mx-auto mb-6" />
        <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
          <CardDescription>Sign up with Google or Apple — it&apos;s free and you&apos;ll never forget a password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="underline">Login</Link>
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}