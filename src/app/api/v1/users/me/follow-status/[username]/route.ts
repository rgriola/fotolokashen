import { NextRequest } from 'next/server';
import { requireAuth, apiError, apiResponse } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function GET(
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

    // Check both directions of follow relationship
    const [isFollowing, isFollowedBy] = await Promise.all([
      prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUser.id
          }
        }
      }),
      prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUser.id,
            followingId: currentUser.id
          }
        }
      })
    ]);

    return apiResponse({
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      followedAt: isFollowing?.createdAt.toISOString() || null
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return apiError('Failed to check follow status', 500);
  }
}
