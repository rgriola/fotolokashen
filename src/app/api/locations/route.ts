import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth, withAuth, parseBoundsFilter } from '@/lib/api-middleware';
import { VALIDATION_CONFIG } from '@/lib/validation-config';
import { sanitizeUserInput, sanitizeArray } from '@/lib/sanitize';
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from '@/lib/rate-limit';
import { attachPhotoSizes } from '@/lib/imagekit';
import type { PublicUser } from '@/types/user';

/**
 * GET /api/locations
 * Get all locations saved by the authenticated user
 * Query params:
 * - sort: 'createdAt' | 'name' | 'rating' (default: 'createdAt')
 * - order: 'asc' | 'desc' (default: 'desc')
 * - type: filter by location type
 * - bounds: 'lat1,lng1,lat2,lng2' for viewport filtering
 * - limit: page size (default: 50, max: 100)
 * - cursor: userSave.id for cursor-based pagination
 */
export const GET = withAuth(async (request: NextRequest, user: PublicUser) => {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const type = searchParams.get('type');

    // Build where clause
    const where: any = {
        userId: user.id,
    };

    // Add type filter if provided
    if (type) {
        where.location = { type };
    }

    // Add bounds filter for viewport loading
    try {
        const boundsFilter = parseBoundsFilter(searchParams);
        if (boundsFilter) {
            where.location = {
                ...where.location,
                ...boundsFilter,
            };
        }
    } catch (e) {
        return apiError(e as string, 400, 'INVALID_BOUNDS');
    }

    // Build orderBy clause
    let orderBy: any = {};
    if (sort === 'name' || sort === 'rating') {
        orderBy = { location: { [sort]: order } };
    } else {
        orderBy = { savedAt: order };
    }

    // Pagination: cursor-based, default 50, max 100
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 50 : limitParam), 100);
    const cursor = searchParams.get('cursor'); // userSave.id (string)
    const cursorId = cursor ? parseInt(cursor, 10) : undefined;

    // Fetch user's saved locations (single query — photos joined via include to avoid N+1)
    const userSaves = await prisma.userSave.findMany({
        where,
        include: {
            location: {
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    photos: {
                        orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
                    },
                },
            },
        },
        orderBy,
        take: limit + 1, // Fetch one extra to determine if there's a next page
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });

    // Determine if there's a next page
    const hasNextPage = userSaves.length > limit;
    const page = hasNextPage ? userSaves.slice(0, limit) : userSaves;
    const nextCursor = hasNextPage ? String(page[page.length - 1].id) : null;

    // Attach ImageKit transform variants to each photo (no extra DB calls)
    const locationsWithPhotos = page.map((userSave) => ({
        ...userSave,
        location: {
            ...userSave.location,
            photos: userSave.location.photos.map(attachPhotoSizes),
        },
    }));

    return apiResponse({
        locations: locationsWithPhotos,
        pagination: {
            limit,
            nextCursor,
            hasNextPage,
        },
    });
});

/**
 * POST /api/locations
 * Save a new location for the authenticated user
 * Body: { placeId, name, address, latitude, longitude, type?, rating? }
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limit: 100 requests per 15 minutes per IP
        const rateLimitResult = await rateLimit(request, {
            ...RateLimitPresets.LENIENT,
            keyPrefix: 'locations-post',
        });
        if (!rateLimitResult.allowed) {
            const response = apiError(
                `Too many requests. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`,
                429,
                'RATE_LIMIT_EXCEEDED'
            );
            addRateLimitHeaders(response.headers, rateLimitResult);
            return response;
        }

        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const body = await request.json();

        // Extract and sanitize inputs
        // NOTE: Coordinates accept BOTH `lat`/`lng` (canonical, per MOBILE_API_SCHEMAS.md)
        // AND `latitude`/`longitude` (legacy). Canonical wins when both are present.
        let {
            placeId, name, address, type, rating,
            // Address components
            street, number, city, state, zipcode,
            // Production details
            productionDate, productionNotes, entryPoint, parking, access,
            // Indoor/Outdoor
            indoorOutdoor,
            // Photo data
            isPermanent,
            // Location details (from iOS Create Location form)
            details,
            // Location group (optional — links to LocationGroup)
            groupId,
        } = body;

        // Normalize coordinates: prefer canonical lat/lng, fall back to latitude/longitude
        const latitude: number | undefined =
            body.lat !== undefined ? body.lat : body.latitude;
        const longitude: number | undefined =
            body.lng !== undefined ? body.lng : body.longitude;

        // Sanitize all text inputs (strips HTML, control chars, URLs)
        name = sanitizeUserInput(name);
        address = sanitizeUserInput(address);
        productionNotes = productionNotes ? sanitizeUserInput(productionNotes) : undefined;
        entryPoint = entryPoint ? sanitizeUserInput(entryPoint) : undefined;
        parking = parking ? sanitizeUserInput(parking) : undefined;
        access = access ? sanitizeUserInput(access) : undefined;
        street = street ? sanitizeUserInput(street) : undefined;
        number = number ? sanitizeUserInput(number) : undefined;
        city = city ? sanitizeUserInput(city) : undefined;
        state = state ? sanitizeUserInput(state) : undefined;
        zipcode = zipcode ? sanitizeUserInput(zipcode) : undefined;
        details = details ? sanitizeUserInput(details) : undefined;

        if (process.env.NODE_ENV !== 'production') {
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
            });
        }

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

        if (details && details.length > 500) {
            return apiError('Location details must be 500 characters or less', 400, 'VALIDATION_ERROR');
        }

        // Extract UserSave fields from body
        const { tags, isFavorite, personalRating, color } = body;

        // Validate tags if provided (before entering transaction)
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

        // Validate groupId if provided (must belong to this user)
        if (groupId !== undefined && groupId !== null) {
            const parsedGroupId = parseInt(groupId, 10);
            if (isNaN(parsedGroupId)) {
                return apiError('Invalid groupId', 400, 'VALIDATION_ERROR');
            }
            const group = await prisma.locationGroup.findFirst({
                where: { id: parsedGroupId, createdBy: user.id },
            });
            if (!group) {
                return apiError('Location group not found or does not belong to you', 404, 'NOT_FOUND');
            }
            groupId = parsedGroupId;
        }

        // === TRANSACTION: Create Location + UserSave + Photos atomically ===
        // If any step fails, the entire operation is rolled back (no orphaned records).
        const userSave = await prisma.$transaction(async (tx) => {
            // 1. Create Location
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Save Location] Creating new location record:', { placeId, name, userId: user.id });
            }
            const location = await tx.location.create({
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
                    // Location details
                    ...(details && { details }),
                    // Metadata
                    ...(isPermanent !== undefined && { isPermanent }),
                    createdBy: user.id,
                    // Link to location group (optional)
                    ...(groupId && { groupId }),
                },
            });
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Save Location] New location created with ID:', location.id);
            }

            // 2. Create UserSave
            const save = await tx.userSave.create({
                data: {
                    userId: user.id,
                    locationId: location.id,
                    tags: tags ? sanitizeArray(tags) : undefined,
                    isFavorite: isFavorite || false,
                    personalRating: personalRating || undefined,
                    color: color || undefined,
                },
                include: {
                    location: {
                        include: {
                            creator: {
                                select: {
                                    id: true,
                                    username: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            });

            // 3. Create Photos (if provided)
            if (body.photos && Array.isArray(body.photos) && body.photos.length > 0) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Save Location] Creating ${body.photos.length} photo(s) for locationId: ${location.id}`);
                }

                // Dedupe within the payload by imagekitFileId — protects against
                // client retries that resend the same uploaded photo reference.
                const seenFileIds = new Set<string>();
                const uniquePhotos: any[] = [];
                for (const photo of body.photos) {
                    const fileId: string | undefined = photo?.imagekitFileId || photo?.fileId;
                    if (!fileId) continue; // skip malformed entries
                    if (seenFileIds.has(fileId)) continue;
                    seenFileIds.add(fileId);
                    uniquePhotos.push(photo);
                }

                if (uniquePhotos.length === 0) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log('[Save Location] No valid (non-duplicate) photos to create');
                    }
                } else {
                    await tx.photo.createMany({
                        data: uniquePhotos.map((photo: any, index: number) => ({
                        locationId: location.id,
                        placeId: location.placeId,
                        userId: user.id,
                        imagekitFileId: photo.imagekitFileId || photo.fileId,
                        imagekitFilePath: photo.imagekitFilePath || photo.filePath,
                        originalFilename: photo.originalFilename || photo.name,
                        fileSize: photo.fileSize || photo.size,
                        mimeType: photo.mimeType || photo.type,
                        width: photo.width,
                        height: photo.height,
                        isPrimary: index === 0,
                        caption: photo.caption || null,
                        // GPS/EXIF metadata (SANITIZED for defense-in-depth)
                        gpsLatitude: photo.gpsLatitude || null,
                        gpsLongitude: photo.gpsLongitude || null,
                        gpsAltitude: photo.gpsAltitude || null,
                        hasGpsData: photo.hasGpsData || false,
                        cameraMake: photo.cameraMake ? sanitizeUserInput(photo.cameraMake) : null,
                        cameraModel: photo.cameraModel ? sanitizeUserInput(photo.cameraModel) : null,
                        lensMake: photo.lensMake ? sanitizeUserInput(photo.lensMake) : null,
                        lensModel: photo.lensModel ? sanitizeUserInput(photo.lensModel) : null,
                        dateTaken: photo.dateTaken ? new Date(photo.dateTaken) : null,
                        iso: photo.iso || null,
                        focalLength: photo.focalLength ? sanitizeUserInput(photo.focalLength) : null,
                        aperture: photo.aperture ? sanitizeUserInput(photo.aperture) : null,
                        shutterSpeed: photo.shutterSpeed ? sanitizeUserInput(photo.shutterSpeed) : null,
                        exposureMode: photo.exposureMode ? sanitizeUserInput(photo.exposureMode) : null,
                        whiteBalance: photo.whiteBalance ? sanitizeUserInput(photo.whiteBalance) : null,
                        flash: photo.flash ? sanitizeUserInput(photo.flash) : null,
                        orientation: photo.orientation || null,
                        colorSpace: photo.colorSpace ? sanitizeUserInput(photo.colorSpace) : null,
                        uploadSource: photo.uploadSource || 'manual',
                    })),
                });

                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Save Location] Photos created successfully (${uniquePhotos.length} unique of ${body.photos.length} submitted)`);
                }
                }
            }

            return save;
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
