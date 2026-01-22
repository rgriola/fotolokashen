import { NextRequest } from 'next/server';
import { requireAuth, apiResponse } from '@/lib/api-middleware';

/**
 * DEBUG ENDPOINT - GET /api/debug/current-user
 * Check what data is in the current user session
 * This helps debug permission issues
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (!authResult.authorized) {
    return apiResponse({
      authenticated: false,
      error: authResult.error,
    });
  }

  return apiResponse({
    authenticated: true,
    user: authResult.user,
    hasRole: !!authResult.user?.role,
    role: authResult.user?.role,
    isAdmin: authResult.user?.isAdmin,
    canAccessAdminPanel: authResult.user?.role === 'staffer' || authResult.user?.role === 'super_admin',
  });
}
