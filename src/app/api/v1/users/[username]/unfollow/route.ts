import { NextRequest } from 'next/server';
import { requireAuth, apiError, apiResponse } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    
    if (!authResult.authorized || !authResult.user) {
      return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const currentUser = authResult.user;

    // Get target user (case-insensitive)
    const normalizedUsername = params.username.toLowerCase().trim();
    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizedUsername,
          mode: 'insensitive'
        }
      },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Find and delete the follow relationship
    const deleted = await prisma.userFollow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: targetUser.id
      }
    });

    if (deleted.count === 0) {
      return apiError('You are not following this user', 400, 'NOT_FOLLOWING');
    }

    return apiResponse({
      success: true,
      message: `Unfollowed @${targetUser.username}`
    });

  } catch (error) {
    console.error('Error deleting follow relationship:', error);
    return apiError('Failed to unfollow user', 500);
  }
}
