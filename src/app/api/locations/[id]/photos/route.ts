import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { getImageKitUrl } from '@/lib/imagekit';

/**
 * GET /api/locations/[id]/photos
 * 
 * List all photos for a location with pagination
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError('Authentication required', 401);
        }

        const { id } = await params;
        const locationId = parseInt(id);
        if (isNaN(locationId)) {
            return apiError('Invalid location ID', 400);
        }

        // Verify location exists
        const location = await prisma.location.findUnique({
            where: { id: locationId },
        });

        if (!location) {
            return apiError('Location not found', 404);
        }

        // Parse pagination parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const skip = (page - 1) * limit;

        // Get total count
        const total = await prisma.photo.count({
            where: {
                locationId,
                imagekitFileId: { not: '' }, // Only confirmed uploads
            },
        });

        // Get photos
        const photos = await prisma.photo.findMany({
            where: {
                locationId,
                imagekitFileId: { not: '' }, // Only confirmed uploads
            },
            orderBy: { uploadedAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                imagekitFilePath: true,
                caption: true,
                width: true,
                height: true,
                uploadedAt: true,
                gpsLatitude: true,
                gpsLongitude: true,
                isPrimary: true,
                fileSize: true,
                mimeType: true,
            },
        });

        // Format photos with URLs
        const formattedPhotos = photos.map(photo => ({
            id: photo.id,
            imagekitFilePath: photo.imagekitFilePath,
            url: getImageKitUrl(photo.imagekitFilePath),
            thumbnailUrl: `${getImageKitUrl(photo.imagekitFilePath)}?tr=w-400,h-400,c-at_max,fo-auto,q-80`,
            caption: photo.caption,
            width: photo.width,
            height: photo.height,
            uploadedAt: photo.uploadedAt.toISOString(),
            gpsLatitude: photo.gpsLatitude,
            gpsLongitude: photo.gpsLongitude,
            isPrimary: photo.isPrimary,
            fileSize: photo.fileSize,
            mimeType: photo.mimeType,
        }));

        const totalPages = Math.ceil(total / limit);

        // Create response with headers
        const response = apiResponse({
            photos: formattedPhotos,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });

        // Add pagination headers
        response.headers.set('X-Total-Count', total.toString());
        response.headers.set('X-Page', page.toString());
        response.headers.set('X-Per-Page', limit.toString());
        response.headers.set('X-Total-Pages', totalPages.toString());

        // Add rate limit headers (placeholder - implement actual rate limiting)
        response.headers.set('X-RateLimit-Limit', '1000');
        response.headers.set('X-RateLimit-Remaining', '987');
        response.headers.set('X-RateLimit-Reset', Math.floor(Date.now() / 1000 + 900).toString());

        return response;

    } catch (error) {
        console.error('List photos error:', error);
        return apiError('Failed to list photos', 500);
    }
}

/**
 * POST /api/locations/[id]/photos
 * 
 * Add a photo to a location (after secure upload via /api/photos/upload)
 * Creates a Photo record linked to the location
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError('Authentication required', 401);
        }
        const user = authResult.user;

        const { id } = await params;
        const locationId = parseInt(id);
        if (isNaN(locationId)) {
            return apiError('Invalid location ID', 400);
        }

        // Verify location exists
        const location = await prisma.location.findUnique({
            where: { id: locationId },
        });

        if (!location) {
            return apiError('Location not found', 404);
        }

        // Parse request body
        const body = await request.json();
        const {
            fileId,
            filePath,
            url,
            thumbnailUrl,
            width,
            height,
            caption,
            gpsLatitude,
            gpsLongitude,
            gpsAltitude,
        } = body;

        // Validate required fields
        if (!fileId || !filePath || !url) {
            return apiError('Missing required fields: fileId, filePath, url', 400);
        }

        // Create photo record
        const photo = await prisma.photo.create({
            data: {
                locationId,
                placeId: location.placeId,
                userId: user.id,
                imagekitFileId: fileId,
                imagekitFilePath: filePath,
                originalFilename: filePath.split('/').pop() || 'photo.jpg',
                width,
                height,
                gpsLatitude,
                gpsLongitude,
                gpsAltitude,
                hasGpsData: !!(gpsLatitude && gpsLongitude),
                caption,
                uploadSource: 'mobile',
            },
        });

        // Format response
        const formattedPhoto = {
            id: photo.id,
            imagekitFilePath: photo.imagekitFilePath,
            url: url,
            thumbnailUrl: thumbnailUrl || `${url}?tr=w-400,h-400,c-at_max,fo-auto,q-80`,
            caption: photo.caption,
            width: photo.width,
            height: photo.height,
            uploadedAt: photo.uploadedAt.toISOString(),
            gpsLatitude: photo.gpsLatitude,
            gpsLongitude: photo.gpsLongitude,
            isPrimary: photo.isPrimary,
            fileSize: photo.fileSize,
            mimeType: photo.mimeType,
        };

        return apiResponse(formattedPhoto, 201);

    } catch (error) {
        console.error('Create photo error:', error);
        return apiError('Failed to create photo', 500);
    }
}
