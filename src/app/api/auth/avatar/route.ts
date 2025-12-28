import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { uploadToImageKit, deleteFromImageKit } from '@/lib/imagekit';
import prisma from '@/lib/prisma';
import { FOLDER_PATHS } from '@/lib/constants/upload';

/**
 * POST /api/auth/avatar
 * Upload user avatar
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        const formData = await request.formData();
        const file = formData.get('avatar') as File;

        if (!file) {
            return apiError('No file provided', 400, 'NO_FILE');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return apiError('File must be an image', 400, 'INVALID_FILE_TYPE');
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return apiError('File size must be less than 5MB', 400, 'FILE_TOO_LARGE');
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to ImageKit
        const uploadResult = await uploadToImageKit({
            file: buffer,
            fileName: `avatar-${authResult.user.id}-${Date.now()}`,
            folder: FOLDER_PATHS.userAvatars(authResult.user.id),
            tags: ['avatar', `user-${authResult.user.id}`],
        });

        if (!uploadResult.success || !uploadResult.url) {
            return apiError('Failed to upload image', 500, 'UPLOAD_FAILED');
        }

        // Get current avatar to delete old one
        const currentUser = await prisma.user.findUnique({
            where: { id: authResult.user.id },
            select: { avatar: true },
        });

        // Update user avatar in database
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: { avatar: uploadResult.url },
        });

        // Delete old avatar from ImageKit (if exists)
        if (currentUser?.avatar && uploadResult.fileId) {
            // Extract fileId from old avatar URL if needed
            // For now, we'll just keep old avatars (can clean up later)
        }

        return apiResponse({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarUrl: uploadResult.url,
        });
    } catch (error: any) {
        console.error('Avatar upload error:', error);
        return apiError('Failed to upload avatar', 500, 'SERVER_ERROR');
    }
}

/**
 * DELETE /api/auth/avatar
 * Remove user avatar
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        // Update user avatar to null
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: { avatar: null },
        });

        return apiResponse({
            success: true,
            message: 'Avatar removed successfully',
        });
    } catch (error: any) {
        console.error('Avatar removal error:', error);
        return apiError('Failed to remove avatar', 500, 'SERVER_ERROR');
    }
}
