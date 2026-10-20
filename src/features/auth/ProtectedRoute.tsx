import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a route so that unauthenticated visitors are redirected to /login.
 * The current path is preserved in `?next=` so the user lands back after login.
 *
 * While the auth session is being restored from localStorage (isLoading),
 * we render nothing to avoid a flash of redirect.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isConfigured } = useAuth();
  const location = useLocation();

  // If Supabase is not configured, allow access (dev/demo mode)
  if (!isConfigured) return <>{children}</>;

  // Wait for session restoration before deciding
  if (isLoading) return null;

  if (!user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
