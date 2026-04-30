import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth, parseBoundsFilter, USER_SUMMARY_SELECT } from '@/lib/api-middleware';
import { attachPhotoSizes } from '@/lib/imagekit';

/**
 * GET /api/v1/locations/friends
 * Get locations from users the current user follows
 * Respects privacy settings (visibility and showSavedLocations)
 * Requires authentication
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const currentUserId = authResult.user.id;
        const searchParams = request.nextUrl.searchParams;
        const boundsParam = searchParams.get('bounds');
        const typeFilter = searchParams.get('type');
        
        // Enforce stricter limit when bounds not provided
        const requestedLimit = parseInt(searchParams.get('limit') || '100');
        const limit = boundsParam 
            ? Math.min(requestedLimit, 500)  // Map view: max 500
            : Math.min(requestedLimit, 100); // Grid view: max 100

        // Cursor-based pagination: client passes the last UserSave.id from previous page
        const cursorParam = searchParams.get('cursor');
        const cursorId = cursorParam ? parseInt(cursorParam, 10) : undefined;
        if (cursorParam && (cursorId === undefined || isNaN(cursorId))) {
            return apiError('Invalid cursor', 400, 'INVALID_CURSOR');
        }

        // Get all users that current user follows
        const following = await prisma.userFollow.findMany({
            where: {
                followerId: currentUserId,
            },
            select: {
                followingId: true,
            },
        });

        const followingIds = following.map(f => f.followingId);

        if (followingIds.length === 0) {
            // User doesn't follow anyone, return empty array
            return apiResponse({ 
                locations: [],
                total: 0,
                limit: limit,
                hasMore: false,
                nextCursor: null,
            });
        }

        // Build location filter with proper typing
        interface LocationFilter {
            type?: string;
            lat?: { gte: number; lte: number };
            lng?: { gte: number; lte: number };
        }

        const locationFilter: LocationFilter = {};

        // Add type filter if provided
        if (typeFilter) {
            locationFilter.type = typeFilter;
        }

        // Add bounds filtering if provided
        try {
            const boundsFilter = parseBoundsFilter(searchParams);
            if (boundsFilter) {
                locationFilter.lat = boundsFilter.lat;
                locationFilter.lng = boundsFilter.lng;
            }
        } catch (e) {
            return apiError(e as string, 400, 'INVALID_BOUNDS');
        }

        // Query UserSaves from followed users with privacy enforcement
        const friendsLocations = await prisma.userSave.findMany({
            where: {
                userId: { in: followingIds },
                OR: [
                    // Public visibility (regardless of showSavedLocations)
                    {
                        visibility: 'public',
                        user: {
                            showSavedLocations: { in: ['public', 'followers'] }
                        }
                    },
                    // Followers visibility (only if user allows followers to see saves)
                    {
                        visibility: 'followers',
                        user: {
                            showSavedLocations: 'followers'
                        }
                    },
                ],
                ...(Object.keys(locationFilter).length > 0 && {
                    location: {
                        is: locationFilter,
                    },
                }),
            },
            take: limit + 1, // Fetch one extra to check if there are more
            select: {
                id: true,
                locationId: true,
                caption: true,
                isFavorite: true,
                personalRating: true,
                tags: true,
                color: true,
                savedAt: true,
                visibility: true,
                location: {
                    select: {
                        id: true,
                        placeId: true,
                        name: true,
                        address: true,
                        city: true,
                        state: true,
                        lat: true,
                        lng: true,
                        type: true,
                        indoorOutdoor: true,
                        photos: {
                            orderBy: [
                                { isPrimary: 'desc' },
                                { uploadedAt: 'asc' },
                            ],
                            select: {
                                id: true,
                                imagekitFilePath: true,
                                isPrimary: true,
                            },
                        },
                    },
                },
                user: {
                    select: USER_SUMMARY_SELECT,
                },
            },
            // Stable ordering: savedAt desc with id desc tiebreaker for cursor stability
            orderBy: [
                { savedAt: 'desc' },
                { id: 'desc' },
            ],
            ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        });

        // Check if there are more results
        const hasMore = friendsLocations.length > limit;
        const locationsToReturn = hasMore ? friendsLocations.slice(0, limit) : friendsLocations;
        const nextCursor = hasMore && locationsToReturn.length > 0
            ? String(locationsToReturn[locationsToReturn.length - 1].id)
            : null;

        // Flatten nested location structure to match iOS MapSocialLocation model
        const flatLocations = locationsToReturn.map(save => ({
            id: save.location.id,
            placeId: save.location.placeId,
            name: save.location.name,
            address: save.location.address ?? null,
            city: save.location.city ?? null,
            state: save.location.state ?? null,
            lat: save.location.lat,
            lng: save.location.lng,
            type: save.location.type ?? null,
            rating: save.personalRating ?? null,
            caption: save.caption ?? null,
            savedAt: save.savedAt ? save.savedAt.toISOString() : null,
            photos: save.location.photos.map(attachPhotoSizes),
            user: save.user,
        }));

        return apiResponse({ 
            locations: flatLocations,
            total: flatLocations.length,
            limit: limit,
            hasMore: hasMore,
            nextCursor: nextCursor,
        });
    } catch (error: unknown) {
        console.error('Error fetching friends locations:', error);
        return apiError('Failed to fetch friends locations', 500, 'FETCH_ERROR');
    }
}
