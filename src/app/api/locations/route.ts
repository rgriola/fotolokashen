import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { VALIDATION_CONFIG } from '@/lib/validation-config';
import { sanitizeText } from '@/lib/sanitize';

/**
 * GET /api/locations
 * Get all locations saved by the authenticated user
 * Query params:
 * - sort: 'createdAt' | 'name' | 'rating' (default: 'createdAt')
 * - order: 'asc' | 'desc' (default: 'desc')
 * - type: filter by location type
 * - bounds: 'lat1,lng1,lat2,lng2' for viewport filtering
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters
        const sort = searchParams.get('sort') || 'createdAt';
        const order = searchParams.get('order') || 'desc';
        const type = searchParams.get('type');
        const bounds = searchParams.get('bounds');

        // Build where clause
        const where: any = {
            userId: user.id,
        };

        // Add type filter if provided
        if (type) {
            where.location = { type };
        }

        // Add bounds filter for viewport loading
        if (bounds) {
            const [lat1, lng1, lat2, lng2] = bounds.split(',').map(Number);
            if (lat1 && lng1 && lat2 && lng2) {
                where.location = {
                    ...where.location,
                    lat: { gte: Math.min(lat1, lat2), lte: Math.max(lat1, lat2) },
                    lng: { gte: Math.min(lng1, lng2), lte: Math.max(lng1, lng2) },
                };
            }
        }

        // Build orderBy clause
        let orderBy: any = {};
        if (sort === 'name' || sort === 'rating') {
            orderBy = { location: { [sort]: order } };
        } else {
            orderBy = { savedAt: order };
        }

        // Fetch user's saved locations
        const userSaves = await prisma.userSave.findMany({
            where,
            include: {
                location: true,
            },
            orderBy,
            take: 100, // Limit for performance
        });

        return apiResponse({ locations: userSaves });
    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return apiError('Failed to fetch locations', 500, 'FETCH_ERROR');
    }
}

/**
 * POST /api/locations
 * Save a new location for the authenticated user
 * Body: { placeId, name, address, latitude, longitude, type?, rating?, caption? }
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const body = await request.json();

        // Extract and sanitize inputs
        let {
            placeId, name, address, latitude, longitude, type, rating, caption,
            // Address components
            street, number, city, state, zipcode,
            // Production details
            productionNotes, entryPoint, parking, access,
            // Photo data
            isPermanent
        } = body;

        // Sanitize all text inputs
        name = sanitizeText(name);
        address = sanitizeText(address);
        caption = caption ? sanitizeText(caption) : undefined;
        productionNotes = productionNotes ? sanitizeText(productionNotes) : undefined;
        entryPoint = entryPoint ? sanitizeText(entryPoint) : undefined;
        parking = parking ? sanitizeText(parking) : undefined;
        access = access ? sanitizeText(access) : undefined;

        // Validation - Required fields
        if (!placeId || !name || !address || latitude === undefined || longitude === undefined) {
            console.error('[Save Location] Missing required fields:', { placeId: !!placeId, name: !!name, address: !!address, latitude, longitude });
            return apiError('Missing required fields', 400, 'VALIDATION_ERROR');
        }

        // Validation - Max length checks
        const { location: locationLimits } = VALIDATION_CONFIG;

        if (name.length > locationLimits.name.max) {
            console.error(`[Save Location] Name too long: ${name.length} chars (max ${locationLimits.name.max})`);
            return apiError(
                `${locationLimits.name.label} must be ${locationLimits.name.max} characters or less`,
                400,
                'VALIDATION_ERROR'
            );
        }

        if (address.length > locationLimits.address.max) {
            console.error(`[Save Location] Address too long: ${address.length} chars (max ${locationLimits.address.max})`);
            return apiError(
                `${locationLimits.address.label} must be ${locationLimits.address.max} characters or less`,
                400,
                'VALIDATION_ERROR'
            );
        }

        if (caption && caption.length > locationLimits.caption.max) {
            console.error(`[Save Location] Caption too long: ${caption.length} chars (max ${locationLimits.caption.max})`);
            return apiError(
                `${locationLimits.caption.label} must be ${locationLimits.caption.max} characters or less`,
                400,
                'VALIDATION_ERROR'
            );
        }

        if (productionNotes && productionNotes.length > locationLimits.notes.max) {
            return apiError(
                `Production notes must be ${locationLimits.notes.max} characters or less`,
                400,
                'VALIDATION_ERROR'
            );
        }

        // Check if location exists
        let location = await prisma.location.findUnique({
            where: { placeId },
        });

        // If location doesn't exist, create it
        if (!location) {
            location = await prisma.location.create({
                data: {
                    placeId,
                    name,
                    address,
                    lat: latitude,
                    lng: longitude,
                    ...(type && { type }),
                    ...(rating !== undefined && rating !== null && { rating }),
                    // Address components
                    ...(street && { street }),
                    ...(number && { number }),
                    ...(city && { city }),
                    ...(state && { state }),
                    ...(zipcode && { zipcode }),
                    // Production details
                    ...(productionNotes && { productionNotes }),
                    ...(entryPoint && { entryPoint }),
                    ...(parking && { parking }),
                    ...(access && { access }),
                    // Metadata
                    ...(isPermanent !== undefined && { isPermanent }),
                    createdBy: user.id, // Set creator
                },
            });
        }

        // Check if user already saved this location
        const existingSave = await prisma.userSave.findUnique({
            where: {
                userId_locationId: {
                    userId: user.id,
                    locationId: location.id,
                },
            },
        });

        if (existingSave) {
            return apiError('Location already saved', 400, 'ALREADY_SAVED');
        }

        // Create UserSave
        const userSave = await prisma.userSave.create({
            data: {
                userId: user.id,
                locationId: location.id,
                caption,
            },
            include: {
                location: true,
            },
        });

        return apiResponse({ userSave }, 201);
    } catch (error: any) {
        console.error('Error saving location:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return apiError(
            error.message || 'Failed to save location',
            500,
            'SAVE_ERROR'
        );
    }
}
