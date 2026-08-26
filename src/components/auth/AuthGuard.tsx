import React, { type ReactNode } from 'react';
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
 */
export function RequireAdmin({ children }: GuardProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [retryCount, setRetryCount] = React.useState(0);

  // After login, checkAdminStatus runs asynchronously. Give it time to complete.
  React.useEffect(() => {
    if (!loading && user && !isAdmin && retryCount < 10) {
      const timer = setTimeout(() => setRetryCount((c) => c + 1), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isAdmin, retryCount]);

  if (loading || (!isAdmin && user && retryCount < 10)) {
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
