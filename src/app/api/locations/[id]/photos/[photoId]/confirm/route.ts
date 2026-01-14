import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * POST /api/locations/[id]/photos/[photoId]/confirm
 * 
 * Confirm successful upload and update photo record with ImageKit details
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    try {
        // Require authentication
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError('Authentication required', 401);
        }

        const { id, photoId: photoIdParam } = await params;
        const locationId = parseInt(id);
        const photoId = parseInt(photoIdParam);

        if (isNaN(locationId) || isNaN(photoId)) {
            return apiError('Invalid location or photo ID', 400);
        }

        // Parse request body
        const body = await request.json();
        const { imagekitFileId, imagekitUrl } = body;

        if (!imagekitFileId || !imagekitUrl) {
            return apiError('Missing required fields: imagekitFileId, imagekitUrl', 400);
        }

        // Find photo record
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return apiError('Photo not found', 404);
        }

        // Verify photo belongs to this location
        if (photo.locationId !== locationId) {
            return apiError('Photo does not belong to this location', 400);
        }

        // Verify photo belongs to authenticated user
        if (photo.userId !== authResult.user.id) {
            return apiError('Unauthorized', 403);
        }

        // Verify photo hasn't already been confirmed
        if (photo.imagekitFileId) {
            return apiError('Photo already confirmed', 400);
        }

        // Extract file path from URL
        const urlObj = new URL(imagekitUrl);
        const imagekitFilePath = urlObj.pathname;

        // Update photo record with ImageKit details
        const updatedPhoto = await prisma.photo.update({
            where: { id: photoId },
            data: {
                imagekitFileId,
                imagekitFilePath,
            },
        });

        // Return success with photo details
        return apiResponse({
            success: true,
            photo: {
                id: updatedPhoto.id,
                imagekitFilePath: updatedPhoto.imagekitFilePath,
                url: imagekitUrl,
                uploadedAt: updatedPhoto.uploadedAt.toISOString(),
            },
        });

    } catch (error) {
        console.error('Confirm upload error:', error);
        return apiError('Failed to confirm upload', 500);
    }
}
