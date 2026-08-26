import { type ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface GuardProps {
  children: ReactNode;
}

/**
 * Redirects unauthenticated users to /login, preserving the intended destination.
 */
export function RequireAuth({ children }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

/**
 * Redirects non-admin users to the admin login page.
 * Waits for the async admin check to complete before deciding.
 */
export function RequireAdmin({ children }: GuardProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [waitCount, setWaitCount] = useState(0);

  // After login, the admin check runs async via /api/admin/me.
  // Wait up to 3 seconds for it to resolve.
  useEffect(() => {
    if (!loading && user && !isAdmin && waitCount < 20) {
      const timer = setTimeout(() => setWaitCount((c) => c + 1), 150);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isAdmin, waitCount]);

  // Still loading or waiting for admin check
  if (loading || (user && !isAdmin && waitCount < 20)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login?error=not_admin" replace />;
  }

  return <>{children}</>;
}
