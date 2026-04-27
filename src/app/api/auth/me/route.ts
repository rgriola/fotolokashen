import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError, clearAuthCookie } from '@/lib/api-middleware';

/**
 * GET /api/auth/me
 * Get current authenticated user
 *
 * IMPORTANT: On 401, the stale auth_token cookie is cleared. This prevents
 * a redirect loop between the edge middleware (which only checks JWT expiry,
 * no DB) and the API layer (which validates the actual DB session). Without
 * this, a deleted DB session + valid JWT cookie creates an infinite
 * /login → /map → /login loop.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
      // Clear the stale cookie so the edge middleware stops redirecting
      // /login → /map for a session that no longer exists in the DB.
      const response = apiError(
        authResult.error || 'Unauthorized',
        401,
        'UNAUTHORIZED'
      );
      clearAuthCookie(response);
      return response;
    }

    return apiResponse({
      success: true,
      user: authResult.user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return apiError('Failed to get user', 500, 'GET_USER_ERROR');
  }
}
