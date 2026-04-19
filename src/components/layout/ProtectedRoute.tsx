import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStatus } from '@sudobility/auth-components';
import { variants } from '@sudobility/design';

interface ProtectedRouteProps {
  /** Content that should only be visible to authenticated users. */
  children: ReactNode;
}

/**
 * Auth guard that wraps child content and only renders it when the user
 * is authenticated. Shows a loading state while auth status is being
 * determined, then redirects unauthenticated users to the home page.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthStatus();
  const { lang } = useParams<{ lang: string }>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
        <div role="status" aria-label="Loading" className={variants.loading.spinner.default()} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/${lang || 'en'}`} replace />;
  }

  return <>{children}</>;
}
