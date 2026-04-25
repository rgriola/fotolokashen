'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component to protect routes that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * Uses window.location.href (hard redirect) instead of router.push
 * because soft navigation doesn't reliably unmount this component,
 * causing repeated redirect attempts in production.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect after loading is complete and user is not found
    if (!isLoading && !user) {
      console.log('[ProtectedRoute] No authenticated user, redirecting to login');
      window.location.href = '/login';
    }
  }, [user, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

