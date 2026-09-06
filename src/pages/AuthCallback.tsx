import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createBrowserSupabase } from '@/lib/supabase';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { LogoMark } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';

/**
 * Landing page for the OAuth redirect. Supabase sends the user back here with
 * either tokens in the URL fragment (implicit flow — picked up by getSession)
 * or a one-time code (PKCE — exchanged explicitly). On success the session is
 * already live via AuthProvider's onAuthStateChange, so we just route home.
 */
export default function AuthCallbackPage() {
  useDocumentMeta('Signing in | JackPass', 'Completing your JackPass sign-in.');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const handle = async () => {
      if (searchParams.get('error')) {
        setError(
          searchParams.get('error_description') ||
            searchParams.get('error') ||
            'Sign-in was cancelled or failed. Please try again.'
        );
        return;
      }

      try {
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          // Implicit flow: getSession() detects the tokens in the URL hash and
          // stores them, which also fires onAuthStateChange in AuthProvider.
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session) {
            setError('No active session found. Please try signing in again.');
            return;
          }
        }
        navigate('/', { replace: true });
      } catch (err: any) {
        setError(err?.message || 'Sign-in failed. Please try again.');
      }
    };

    handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
      <div className="relative w-full max-w-sm px-4 text-center">
        <LogoMark className="h-12 w-12 mx-auto mb-6" />
        {error ? (
          <>
            <h1 className="text-xl font-headline mb-2">Sign-in failed</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button asChild variant="outline">
              <Link to="/login">Back to Login</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-headline mb-2">Signing you in…</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we complete your sign-in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}