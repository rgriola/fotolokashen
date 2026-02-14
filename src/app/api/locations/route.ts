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

        // Fetch photos for each location (now uses locationId for user-specific photos)
        const locationsWithPhotos = await Promise.all(
            userSaves.map(async (userSave) => {
                const photos = await prisma.photo.findMany({
                    where: { locationId: userSave.location.id },
                    orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
                });
                return {
                    ...userSave,
                    location: {
                        ...userSave.location,
                        photos,
                    },
                };
            })
        );

        return apiResponse({ locations: locationsWithPhotos });
    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return apiError('Failed to fetch locations', 500, 'FETCH_ERROR');
    }
}

/**
 * POST /api/locations
 * Save a new location for the authenticated user
 * Body: { placeId, name, address, latitude, longitude, type?, rating? }
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
            placeId, name, address, latitude, longitude, type, rating,
            // Address components
            street, number, city, state, zipcode,
            // Production details
            productionDate, productionNotes, entryPoint, parking, access,
            // Indoor/Outdoor
            indoorOutdoor,
            // Photo data
            isPermanent
        } = body;

        // Sanitize all text inputs
        name = sanitizeText(name);
        address = sanitizeText(address);
        productionNotes = productionNotes ? sanitizeText(productionNotes) : undefined;
        entryPoint = entryPoint ? sanitizeText(entryPoint) : undefined;
        parking = parking ? sanitizeText(parking) : undefined;
        access = access ? sanitizeText(access) : undefined;

        // Debug logging - see what we received
        console.log('[Save Location] Received data:', {
            placeId,
            name,
            address,
            latitude,
            longitude,
            type,
            indoorOutdoor,
            hasPhotos: !!body.photos,
            photoCount: body.photos ? body.photos.length : 0,
            photoData: body.photos ? body.photos.map((p: any) => ({ 
                fileId: p.imagekitFileId || p.fileId,
                hasFileId: !!(p.imagekitFileId || p.fileId)
            })) : null
        });

        // Validation - Required fields
        if (!placeId || !name || !address || latitude === undefined || longitude === undefined) {
            console.error('[Save Location] Missing required fields:', {
                placeId: !!placeId,
                name: !!name,
                address: !!address,
                latitude,
                longitude
            });
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

        if (productionNotes && productionNotes.length > locationLimits.notes.max) {
            return apiError(
                `Production notes must be ${locationLimits.notes.max} characters or less`,
                400,
                'VALIDATION_ERROR'
            );
        }

        // Create a new location record for this save
        // Users can now save the same Google place multiple times (e.g., different shoots)
        console.log('[Save Location] Creating new location record:', { placeId, name, userId: user.id });
        const location = await prisma.location.create({
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
                ...(productionDate && { productionDate: new Date(productionDate) }),
                ...(productionNotes && { productionNotes }),
                ...(entryPoint && { entryPoint }),
                ...(parking && { parking }),
                ...(access && { access }),
                // Indoor/Outdoor
                ...(indoorOutdoor && { indoorOutdoor }),
                // Metadata
                ...(isPermanent !== undefined && { isPermanent }),
                createdBy: user.id, // Set creator
            },
        });
        console.log('[Save Location] New location created with ID:', location.id);

        // Extract UserSave fields from body
        const { tags, isFavorite, personalRating, color } = body;

        // Validate tags if provided
        if (tags && Array.isArray(tags)) {
            if (tags.length > 20) {
                return apiError('Maximum 20 tags allowed', 400, 'VALIDATION_ERROR');
            }
            for (const tag of tags) {
                if (typeof tag !== 'string' || tag.length > 25) {
                    return apiError('Tags must be strings with max 25 characters', 400, 'VALIDATION_ERROR');
                }
            }
        }

        // Create UserSave with all fields
        const userSave = await prisma.userSave.create({
            data: {
                userId: user.id,
                locationId: location.id,
                tags: tags ? tags : undefined, // Prisma will convert array to JSON
                isFavorite: isFavorite || false,
                personalRating: personalRating || undefined,
                color: color || undefined,
            },
            include: {
                location: true,
            },
        });

        // Handle photos if provided
        if (body.photos && Array.isArray(body.photos) && body.photos.length > 0) {
            console.log(`[Save Location] Creating ${body.photos.length} photo(s) for locationId: ${location.id}`);

            await prisma.photo.createMany({
                data: body.photos.map((photo: any, index: number) => ({
                    locationId: location.id,  // Link to user's specific location
                    placeId: location.placeId,
                    userId: user.id,
                    imagekitFileId: photo.imagekitFileId || photo.fileId,
                    imagekitFilePath: photo.imagekitFilePath || photo.filePath,
                    originalFilename: photo.originalFilename || photo.name,
                    fileSize: photo.fileSize || photo.size,
                    mimeType: photo.mimeType || photo.type,
                    width: photo.width,
                    height: photo.height,
                    isPrimary: index === 0, // First photo is primary
                    caption: photo.caption || null,
                    // GPS/EXIF metadata (SANITIZED for defense-in-depth)
                    gpsLatitude: photo.gpsLatitude || null,
                    gpsLongitude: photo.gpsLongitude || null,
                    gpsAltitude: photo.gpsAltitude || null,
                    hasGpsData: photo.hasGpsData || false,
                    cameraMake: photo.cameraMake ? sanitizeText(photo.cameraMake) : null,
                    cameraModel: photo.cameraModel ? sanitizeText(photo.cameraModel) : null,
                    lensMake: photo.lensMake ? sanitizeText(photo.lensMake) : null,
                    lensModel: photo.lensModel ? sanitizeText(photo.lensModel) : null,
                    dateTaken: photo.dateTaken ? new Date(photo.dateTaken) : null,
                    iso: photo.iso || null,
                    focalLength: photo.focalLength ? sanitizeText(photo.focalLength) : null,
                    aperture: photo.aperture ? sanitizeText(photo.aperture) : null,
                    shutterSpeed: photo.shutterSpeed ? sanitizeText(photo.shutterSpeed) : null,
                    exposureMode: photo.exposureMode ? sanitizeText(photo.exposureMode) : null,
                    whiteBalance: photo.whiteBalance ? sanitizeText(photo.whiteBalance) : null,
                    flash: photo.flash ? sanitizeText(photo.flash) : null,
                    orientation: photo.orientation || null,
                    colorSpace: photo.colorSpace ? sanitizeText(photo.colorSpace) : null,
                    uploadSource: photo.uploadSource || 'manual',
                })),
            });

            console.log(`[Save Location] Photos created successfully`);
        }

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
