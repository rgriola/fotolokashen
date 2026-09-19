import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError, authErrorResponse, clearAuthCookie } from '@/lib/api-middleware';

/**
 * GET /api/auth/me
 * Get current authenticated user
 *
 * IMPORTANT: On a real 401, the stale auth_token cookie is cleared. This
 * prevents a redirect loop between the edge middleware (which only checks
 * JWT expiry, no DB) and the API layer (which validates the actual DB
 * session). Without this, a deleted DB session + valid JWT cookie creates
 * an infinite /login → /map → /login loop.
 *
 * A 503 ("could not verify", e.g. a transient DB hiccup) must NOT clear the
 * cookie — the session may still be valid. Clearing it here previously
 * logged users out on every transient DB blip, since this endpoint is
 * refetched on every window focus.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
      const response = authErrorResponse(authResult);
      if ((authResult.status ?? 401) === 401) {
        clearAuthCookie(response);
      }
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
