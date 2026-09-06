import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { normalizeSupabaseUrl } from '@/lib/supabase-utils';
import { cn } from '@/lib/utils';

type OAuthProvider = 'google' | 'apple';

const PROVIDERS: { id: OAuthProvider; label: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
];

export function OAuthButtons({ className }: { className?: string }) {
  const { signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState<Set<OAuthProvider> | null>(null);
  const [loading, setLoading] = useState(false);

  // Only render providers the Supabase project has enabled (the auth settings
  // endpoint is public). If the call fails, fall back to showing both — an
  // unconfigured provider surfaces a clear error on click instead.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        if (!url) return;
        const res = await fetch(`${normalizeSupabaseUrl(url)}/auth/v1/settings`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
        });
        if (!res.ok) return;
        const settings = await res.json();
        const external = settings?.external;
        if (!cancelled && external) {
          const available = new Set<OAuthProvider>();
          if (external.google) available.add('google');
          if (external.apple) available.add('apple');
          if (available.size > 0) setEnabled(available);
        }
      } catch {
        // ignore — fall back to the full provider list
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const providers = enabled ? PROVIDERS.filter((p) => enabled.has(p.id)) : PROVIDERS;

  const handleClick = async (provider: OAuthProvider) => {
    setLoading(true);
    try {
      await signInWithOAuth(provider);
      // The SDK redirects the browser to the provider; if that doesn't happen
      // (e.g. the provider isn't configured), show why.
      setTimeout(() => setLoading(false), 5000);
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: error?.message || `Could not start ${provider} sign-in. Make sure it is enabled in the Supabase dashboard.`,
      });
    }
  };

  return (
    <div className={cn('grid gap-3', className)}>
      {providers.map(({ id, label, icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          className="w-full gap-3"
          disabled={loading}
          onClick={() => handleClick(id)}
        >
          {icon}
          {label}
        </Button>
      ))}
    </div>
  );
}