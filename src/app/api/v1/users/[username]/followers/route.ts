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

    // Get followers with pagination
    const [followers, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: {
          followingId: targetUser.id
        },
        include: {
          follower: {
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
          followingId: targetUser.id
        }
      })
    ]);

    // Format response
    const formattedFollowers = followers.map(follow => ({
      id: follow.follower.id,
      username: follow.follower.username,
      displayName: follow.follower.firstName && follow.follower.lastName
        ? `${follow.follower.firstName} ${follow.follower.lastName}`
        : follow.follower.username,
      avatar: follow.follower.avatar,
      bio: follow.follower.bio,
      followedAt: follow.createdAt.toISOString()
    }));

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      followers: formattedFollowers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching followers:', error);
    return apiError('Failed to fetch followers', 500);
  }
}
