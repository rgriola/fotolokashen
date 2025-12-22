import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
      return apiError(
        authResult.error || 'Unauthorized',
        401,
        'UNAUTHORIZED'
      );
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
