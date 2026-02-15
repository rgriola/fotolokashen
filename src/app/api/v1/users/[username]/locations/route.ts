import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/api-middleware';
import { normalizeUsername } from '@/lib/username-utils';

/**
 * GET /api/v1/users/:username/locations
 * Get paginated public locations for a user (mobile API)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Verify user exists (case-insensitive lookup)
    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: normalizeUsername(cleanUsername),
          mode: 'insensitive'
        }
      },
      select: { id: true, username: true },
    });

    if (!user) {
      return apiError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get total count (for pagination metadata)
    const totalCount = await prisma.userSave.count({
      where: {
        userId: user.id,
        visibility: 'public',
      },
    });

    // Fetch public locations
    const locations = await prisma.userSave.findMany({
      where: {
        userId: user.id,
        visibility: 'public',
      },
      include: {
        location: {
          include: {
            photos: {
              orderBy: [
                { isPrimary: 'desc' }, // Primary photo first
                { uploadedAt: 'asc' },  // Then by upload date
              ],
            },
          },
        },
      },
      orderBy: [
        { location: { createdAt: 'desc' } },
      ],
      take: limit,
      skip: offset,
    });

    // Format response for mobile
    const formattedLocations = locations.map((save) => ({
      id: save.id,
      caption: save.caption,
      savedAt: save.savedAt.toISOString(),
      location: {
        id: save.location.id,
        placeId: save.location.placeId,
        name: save.location.name,
        address: save.location.address || null,
        city: save.location.city || null,
        state: save.location.state || null,
        latitude: save.location.lat,
        longitude: save.location.lng,
        type: save.location.indoorOutdoor || null,
        rating: save.location.rating || null,
        photos: save.location.photos.map((photo) => ({
          id: photo.id,
          url: photo.imagekitFilePath,
          thumbnailUrl: photo.imagekitFilePath, // ImageKit can add transformations via query params
          isPrimary: photo.isPrimary,
          caption: photo.caption,
        })),
      },
    }));

    const responseData = {
      locations: formattedLocations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + locations.length < totalCount,
      },
      user: {
        username: user.username,
        profileUrl: `/@${user.username}`,
      },
    };

    const response = NextResponse.json(responseData, { status: 200 });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    response.headers.set('X-API-Version', '1.0');
    response.headers.set('X-Total-Count', totalCount.toString());
    response.headers.set('X-Page', page.toString());
    response.headers.set('X-Per-Page', limit.toString());

    return response;
  } catch (error) {
    console.error('[API v1] Error fetching user locations:', error);
    return apiError('Failed to fetch locations', 500, 'INTERNAL_ERROR');
  }
}
