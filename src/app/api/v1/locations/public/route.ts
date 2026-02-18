import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * GET /api/v1/locations/public
 * Get all public locations from all users with optional viewport bounds filtering
 * Requires authentication to prevent abuse
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const searchParams = request.nextUrl.searchParams;
        const boundsParam = searchParams.get('bounds');
        const typeFilter = searchParams.get('type');
        
        // Enforce stricter limit when bounds not provided (grid view use case)
        const requestedLimit = parseInt(searchParams.get('limit') || '100');
        const limit = boundsParam 
            ? Math.min(requestedLimit, 500)  // Map view: max 500
            : Math.min(requestedLimit, 100); // Grid view: max 100

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
        if (boundsParam) {
            try {
                const bounds = JSON.parse(boundsParam);
                locationFilter.lat = {
                    gte: bounds.south,
                    lte: bounds.north,
                };
                locationFilter.lng = {
                    gte: bounds.west,
                    lte: bounds.east,
                };
            } catch {
                return apiError('Invalid bounds parameter', 400, 'INVALID_BOUNDS');
            }
        }

        const whereClause = {
            visibility: 'public' as const,
            location: {
                is: locationFilter,
            },
        };

        const publicLocations = await prisma.userSave.findMany({
            where: whereClause,
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
                            where: {
                                isPrimary: true,
                            },
                            take: 1,
                            select: {
                                imagekitFilePath: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                savedAt: 'desc',
            },
        });

        // Check if there are more results
        const hasMore = publicLocations.length > limit;
        const locationsToReturn = hasMore ? publicLocations.slice(0, limit) : publicLocations;

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
            savedAt: save.savedAt?.toISOString?.() ?? null,
            photos: save.location.photos,
            user: save.user,
        }));

        return apiResponse({ 
            locations: flatLocations,
            total: flatLocations.length,
            limit: limit,
            hasMore: hasMore,
        });
    } catch (error: unknown) {
        console.error('Error fetching public locations:', error);
        return apiError('Failed to fetch public locations', 500, 'FETCH_ERROR');
    }
}
