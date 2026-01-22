'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { canAccessAdminPanel } from '@/lib/permissions';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component to protect admin-only routes
 * Redirects to home if user is not authenticated or not an admin/staffer
 * Uses new role-based permission system
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only check after loading is complete
    if (!isLoading) {
      if (!user) {
        console.log('[AdminRoute] No authenticated user, redirecting to login');
        toast.error('Please login to access this page');
        router.push('/login');
      } else if (!canAccessAdminPanel(user)) {
        console.log('[AdminRoute] User does not have admin access, redirecting to home');
        toast.error('Admin access required');
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not admin
  if (!user || !canAccessAdminPanel(user)) {
    return null;
  }

  // User is authenticated and has admin access, render the protected content
  return <>{children}</>;
}
