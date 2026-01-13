import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { uploadToImageKit, getImageKitFolder, deleteFromImageKit } from '@/lib/imagekit';
import prisma from '@/lib/prisma';
import { FOLDER_PATHS } from '@/lib/constants/upload';

/**
 * POST /api/auth/banner
 * Upload user banner image
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        const contentType = request.headers.get('content-type');
        let bannerUrl: string;
        let fileId: string | undefined;

        // Handle ImageKit direct upload (JSON with bannerUrl)
        if (contentType?.includes('application/json')) {
            const body = await request.json();
            bannerUrl = body.bannerUrl;
            fileId = body.fileId;

            if (!bannerUrl) {
                return apiError('No banner URL provided', 400, 'NO_URL');
            }
        }
        // Handle traditional FormData upload
        else {
            const formData = await request.formData();
            const file = formData.get('banner') as File;

            if (!file) {
                return apiError('No file provided', 400, 'NO_FILE');
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                return apiError('File must be an image', 400, 'INVALID_FILE_TYPE');
            }

            // Validate file size (10MB max for banners - larger than avatars)
            if (file.size > 10 * 1024 * 1024) {
                return apiError('File size must be less than 10MB', 400, 'FILE_TOO_LARGE');
            }

            // Convert file to buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to ImageKit
            const uploadResult = await uploadToImageKit({
                file: buffer,
                fileName: `banner-${authResult.user.id}-${Date.now()}`,
                folder: getImageKitFolder(`users/${authResult.user.id}/banners`),
                tags: ['banner', `user-${authResult.user.id}`],
            });

            if (!uploadResult.success || !uploadResult.url) {
                return apiError('Failed to upload image', 500, 'UPLOAD_FAILED');
            }

            bannerUrl = uploadResult.url;
            fileId = uploadResult.fileId;
        }

        console.log('[Banner API] Saving banner to database:', {
            userId: authResult.user.id,
            bannerUrl,
            fileId
        });

        // Get current banner to delete old one
        const currentUser = await prisma.user.findUnique({
            where: { id: authResult.user.id },
            select: { 
                bannerImage: true,
                bannerFileId: true 
            },
        });

        // Delete old banner from ImageKit BEFORE saving new one
        if (currentUser?.bannerFileId) {
            console.log('[Banner API] Deleting old banner:', currentUser.bannerFileId);
            const deleteResult = await deleteFromImageKit(currentUser.bannerFileId);
            if (!deleteResult.success) {
                console.warn('[Banner API] Failed to delete old banner:', deleteResult.error);
                // Continue anyway - don't block the upload
            } else {
                console.log('[Banner API] Old banner deleted successfully');
            }
        }

        // Update user banner in database
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: { 
                bannerImage: bannerUrl,
                bannerFileId: fileId 
            },
        });

        console.log('[Banner API] Banner saved successfully');

        return apiResponse({
            success: true,
            message: 'Banner uploaded successfully',
            bannerUrl: bannerUrl,
        });
    } catch (error: any) {
        console.error('Banner upload error:', error);
        return apiError('Failed to upload banner', 500, 'SERVER_ERROR');
    }
}

/**
 * DELETE /api/auth/banner
 * Remove user banner image
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        // Remove banner from database
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: { bannerImage: null },
        });

        return apiResponse({
            success: true,
            message: 'Banner removed successfully',
        });
    } catch (error: any) {
        console.error('Banner delete error:', error);
        return apiError('Failed to remove banner', 500, 'SERVER_ERROR');
    }
}
