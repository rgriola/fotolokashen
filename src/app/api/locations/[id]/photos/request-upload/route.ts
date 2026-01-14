import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { generateSignedUploadUrl } from '@/lib/imagekit';

/**
 * POST /api/locations/[id]/photos/request-upload
 * 
 * Request a signed upload URL for uploading a photo to a location
 * Creates a pending photo record and returns ImageKit upload credentials
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

        const { id } = await params;
        const locationId = parseInt(id);
        if (isNaN(locationId)) {
            return apiError('Invalid location ID', 400);
        }

        // Verify location exists and user has access
        const location = await prisma.location.findUnique({
            where: { id: locationId },
        });

        if (!location) {
            return apiError('Location not found', 404);
        }

        // For now, allow any authenticated user to upload photos
        // In the future, you might want to restrict this based on permissions

        // Parse request body
        const body = await request.json();
        const {
            filename,
            mimeType,
            size,
            width,
            height,
            capturedAt,
            gpsLatitude,
            gpsLongitude,
            gpsAltitude,
            gpsAccuracy,
            cameraMake,
            cameraModel,
            lensMake,
            lensModel,
            iso,
            focalLength,
            aperture,
            shutterSpeed,
            exposureMode,
            whiteBalance,
            flash,
            orientation,
            colorSpace,
        } = body;

        // Validate required fields
        if (!filename || !mimeType) {
            return apiError('Missing required fields: filename, mimeType', 400);
        }

        // Validate mime type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
        if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
            return apiError('Invalid mime type. Only JPEG, PNG, and HEIC images are allowed', 400);
        }

        // Validate file size (max 10MB)
        if (size && size > 10 * 1024 * 1024) {
            return apiError('File size exceeds 10MB limit', 400);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = filename.split('.').pop() || 'jpg';
        const serverFileName = `photo_${timestamp}.${extension}`;

        // Create pending photo record in database
        const photo = await prisma.photo.create({
            data: {
                locationId,
                placeId: location.placeId,
                userId: authResult.user.id,
                imagekitFileId: '', // Will be updated on confirm
                imagekitFilePath: '', // Will be updated on confirm
                originalFilename: filename,
                fileSize: size,
                mimeType,
                width,
                height,
                gpsLatitude,
                gpsLongitude,
                gpsAltitude,
                gpsAccuracy,
                hasGpsData: !!(gpsLatitude && gpsLongitude),
                cameraMake,
                cameraModel,
                lensMake,
                lensModel,
                dateTaken: capturedAt ? new Date(capturedAt) : null,
                iso,
                focalLength,
                aperture,
                shutterSpeed,
                exposureMode,
                whiteBalance,
                flash,
                orientation,
                colorSpace,
                uploadSource: 'mobile',
            },
        });

        // Generate signed upload URL
        const uploadParams = await generateSignedUploadUrl({
            folder: `locations/${locationId}`,
            fileName: serverFileName,
        });

        // Return upload credentials
        return apiResponse({
            photoId: photo.id,
            ...uploadParams,
        });

    } catch (error) {
        console.error('Request upload error:', error);
        return apiError('Failed to generate upload URL', 500);
    }
}
