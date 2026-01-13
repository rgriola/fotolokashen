import { NextRequest } from 'next/server';
import { apiError, apiResponse } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

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

    // Get following with pagination
    const [following, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: {
          followerId: targetUser.id
        },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.userFollow.count({
        where: {
          followerId: targetUser.id
        }
      })
    ]);

    // Format response
    const formattedFollowing = following.map(follow => ({
      id: follow.following.id,
      username: follow.following.username,
      displayName: follow.following.firstName && follow.following.lastName
        ? `${follow.following.firstName} ${follow.following.lastName}`
        : follow.following.username,
      avatar: follow.following.avatar,
      bio: follow.following.bio,
      followedAt: follow.createdAt.toISOString()
    }));

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      following: formattedFollowing,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching following:', error);
    return apiError('Failed to fetch following', 500);
  }
}
