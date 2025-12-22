import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, clearAuthCookie } from '@/lib/api-middleware';

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (token) {
      // Delete session from database
      try {
        await prisma.session.deleteMany({
          where: { token },
        });
      } catch (error) {
        console.error('Failed to delete session:', error);
        // Continue with logout even if session deletion fails
      }
    }

    // Clear auth cookie
    const response = apiResponse({
      success: true,
      message: 'Logged out successfully',
    });

    clearAuthCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return apiError('Failed to logout', 500, 'LOGOUT_ERROR');
  }
}
