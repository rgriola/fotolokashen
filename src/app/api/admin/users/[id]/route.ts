import { NextRequest } from 'next/server';
import { requireAdmin, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { deleteFromImageKit, deleteImageKitFolder } from '@/lib/storage';
import { sendAccountDeletionEmail } from '@/lib/email';
import { getUserRootFolder } from '@/lib/constants/upload';

// Runtime config for edge/node
export const runtime = 'nodejs';

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all associated data
 * Admin only
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[DeleteUser] Starting deletion request');
    
    // Check admin authorization
    const authResult = await requireAdmin(req);
    console.log('[DeleteUser] Auth result:', authResult.authorized);
    
    if (!authResult.authorized) {
        console.log('[DeleteUser] Unauthorized:', authResult.error);
        return apiError(authResult.error || 'Unauthorized', 401);
    }

    const adminUser = authResult.user!;
    const { id } = await params;
    const userId = parseInt(id);

    console.log('[DeleteUser] Admin user:', adminUser.email, 'Deleting user ID:', userId);

    if (isNaN(userId)) {
        console.log('[DeleteUser] Invalid user ID:', id);
        return apiError('Invalid user ID', 400);
    }

    // Prevent self-deletion
    if (userId === adminUser.id) {
        console.log('[DeleteUser] Attempted self-deletion');
        return apiError('Cannot delete your own account', 400);
    }

    try {
        // Fetch user with all related data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                uploadedPhotos: {
                    select: {
                        id: true,
                        imagekitFileId: true,
                        imagekitFilePath: true,
                    },
                },
                _count: {
                    select: {
                        sessions: true,
                        createdLocations: true,
                        uploadedPhotos: true,
                        savedLocations: true,
                    },
                },
            },
        });

        if (!user) {
            return apiError('User not found', 404);
        }

        // Delete photos from storage (ImageKit CDN today)
        if (user.uploadedPhotos.length > 0) {
            console.log(`[DeleteUser] Deleting ${user.uploadedPhotos.length} photos from storage...`);

            // Delete individual photo files
            for (const photo of user.uploadedPhotos) {
                const result = await deleteFromImageKit(photo.imagekitFileId);
                if (result.success) {
                    console.log(`[DeleteUser] Deleted photo ${photo.id} from storage`);
                } else {
                    console.error(`[DeleteUser] Failed to delete photo ${photo.id} from storage:`, result.error);
                    // Continue even if CDN deletion fails
                }
            }

            // Delete the user's entire folder from storage
            // Uses environment-aware path: /production/users/{userId}/ or /development/users/{userId}/
            const userFolderPath = getUserRootFolder(userId);
            console.log(`[DeleteUser] Attempting to delete user folder: ${userFolderPath}`);
            const folderResult = await deleteImageKitFolder(userFolderPath);
            if (folderResult.success) {
                console.log(`[DeleteUser] Deleted user folder ${userFolderPath} from storage`);
            } else {
                console.error(`[DeleteUser] Failed to delete user folder from storage:`, folderResult.error);
                // Continue even if folder deletion fails (might not exist or already empty)
            }
        }

        // Delete user (cascade will handle Sessions, Locations, Photos, Saves)
        await prisma.user.delete({
            where: { id: userId },
        });

        // Create audit log
        await prisma.securityLog.create({
            data: {
                userId: adminUser.id,
                eventType: 'ADMIN_USER_DELETED',
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                success: true,
                metadata: {
                    deletedUserId: user.id,
                    deletedUserEmail: user.email,
                    deletedUserUsername: user.username,
                    deletedUserName: user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.firstName || user.lastName || user.username,
                    deletedCounts: user._count,
                    deletedAt: new Date().toISOString(),
                },
            },
        });

        // Send deletion notification email to user
        const userName = user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.lastName || user.username;
        
        try {
            await sendAccountDeletionEmail(user.email, userName);
            console.log(`[DeleteUser] Deletion notification email sent to ${user.email}`);
        } catch (error) {
            console.error(`[DeleteUser] Failed to send deletion email to ${user.email}:`, error);
            // Continue even if email fails - user is already deleted
        }

        console.log(`[DeleteUser] User ${user.email} deleted by admin ${adminUser.email}`);

        return apiResponse({
            success: true,
            message: `User ${user.email} deleted successfully`,
            deletedUser: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        
        // Log failed deletion attempt
        await prisma.securityLog.create({
            data: {
                userId: adminUser.id,
                eventType: 'ADMIN_USER_DELETE_FAILED',
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
                success: false,
                metadata: {
                    targetUserId: userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            },
        });

        return apiError('Failed to delete user', 500);
    }
}
