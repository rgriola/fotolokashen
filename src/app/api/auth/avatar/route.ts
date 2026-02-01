import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { uploadToImageKit, deleteFromImageKit } from '@/lib/imagekit';
import prisma from '@/lib/prisma';
import { FOLDER_PATHS } from '@/lib/constants/upload';
import { scanFile } from '@/lib/virus-scan';

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

        const contentType = request.headers.get('content-type');
        let avatarUrl: string;
        let fileId: string | undefined;

        // Handle ImageKit direct upload (JSON with avatarUrl)
        if (contentType?.includes('application/json')) {
            const body = await request.json();
            avatarUrl = body.avatarUrl;
            fileId = body.fileId;

            if (!avatarUrl) {
                return apiError('No avatar URL provided', 400, 'NO_URL');
            }
        }
        // Handle traditional FormData upload
        else {
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

            // Scan for viruses and malware
            const scanResult = await scanFile(buffer, file.name);
            if (scanResult.isInfected) {
                console.error(`[Avatar API] Virus detected in ${file.name}:`, scanResult.viruses);
                return apiError(
                    scanResult.error || 'File failed security scan',
                    400,
                    'SECURITY_VIOLATION'
                );
            }

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

            avatarUrl = uploadResult.url;
            fileId = uploadResult.fileId;
        }

        // Get current avatar to delete old one
        const currentUser = await prisma.user.findUnique({
            where: { id: authResult.user.id },
            select: { 
                avatar: true,
                avatarFileId: true 
            },
        });

        // Delete old avatar from ImageKit BEFORE saving new one
        if (currentUser?.avatarFileId) {
            console.log('[Avatar API] Deleting old avatar:', currentUser.avatarFileId);
            const deleteResult = await deleteFromImageKit(currentUser.avatarFileId);
            if (!deleteResult.success) {
                console.warn('[Avatar API] Failed to delete old avatar:', deleteResult.error);
                // Continue anyway - don't block the upload
            } else {
                console.log('[Avatar API] Old avatar deleted successfully');
            }
        }

        // Update user avatar in database
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: { 
                avatar: avatarUrl,
                avatarFileId: fileId 
            },
        });

        return apiResponse({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarUrl: avatarUrl,
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
