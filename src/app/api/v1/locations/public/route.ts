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
        const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 500); // Max 500 locations

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
            } catch (_error) {
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
            take: limit,
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

        return apiResponse({ 
            locations: publicLocations,
            total: publicLocations.length,
            limit: limit,
        });
    } catch (error: unknown) {
        console.error('Error fetching public locations:', error);
        return apiError('Failed to fetch public locations', 500, 'FETCH_ERROR');
    }
}
