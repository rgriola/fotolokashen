import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { deleteFromImageKit } from '@/lib/storage';
import { scanFile } from '@/lib/virus-scan';

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
        // URL format: https://ik.imagekit.io/rgriola/production/users/4/photos/file.jpg
        // We want: /production/users/4/photos/file.jpg (without /rgriola)
        const urlObj = new URL(imagekitUrl);
        let imagekitFilePath = urlObj.pathname;

        // Remove the ImageKit account name from the path (e.g., /rgriola)
        // The path should start with /production or /development
        const pathParts = imagekitFilePath.split('/').filter(Boolean);
        if (pathParts.length > 0 && !pathParts[0].startsWith('production') && !pathParts[0].startsWith('development')) {
            // Remove the first part (account name)
            imagekitFilePath = '/' + pathParts.slice(1).join('/');
        }

        // ── Virus scan ────────────────────────────────────────────────────────
        // Direct client-to-storage uploads bypass the server-mediated pipeline,
        // so we fetch the uploaded file back from the CDN and scan it here
        // before persisting the confirmed record.
        const fileName = imagekitFilePath.split('/').filter(Boolean).pop() ?? 'uploaded-file';

        let fileBuffer: Buffer;
        try {
            const fileResponse = await fetch(imagekitUrl);
            if (!fileResponse.ok) {
                console.error(`[Confirm Upload] Failed to fetch file for scanning (HTTP ${fileResponse.status})`);
                await deleteFromImageKit(imagekitFileId).catch(() => {});
                await prisma.photo.delete({ where: { id: photoId } });
                return apiError('Failed to verify uploaded file', 500);
            }
            fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
        } catch (fetchError) {
            console.error('[Confirm Upload] Fetch error during scan:', fetchError);
            await deleteFromImageKit(imagekitFileId).catch(() => {});
            await prisma.photo.delete({ where: { id: photoId } });
            return apiError('Failed to verify uploaded file', 500);
        }

        const scanResult = await scanFile(fileBuffer, fileName);

        if (scanResult.isInfected) {
            console.error(`[Confirm Upload] 🚨 INFECTED file detected: ${fileName}`, scanResult.viruses);

            // Remove from storage
            await deleteFromImageKit(imagekitFileId).catch((err: unknown) =>
                console.error('[Confirm Upload] Failed to delete infected file from storage:', err)
            );

            // Remove the pending Photo row
            await prisma.photo.delete({ where: { id: photoId } });

            // Audit trail
            await prisma.securityLog.create({
                data: {
                    userId: authResult.user.id,
                    eventType: 'PHOTO_UPLOAD_BLOCKED',
                    metadata: {
                        viruses: scanResult.viruses,
                        filename: fileName,
                        directUpload: true,
                        locationId,
                        photoId,
                    },
                    ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
                },
            });

            return apiError(
                scanResult.error ?? 'File failed security scan',
                400,
                'SECURITY_VIOLATION'
            );
        }

        console.log(`[Confirm Upload] ✅ File clean: ${fileName}`);
        // ─────────────────────────────────────────────────────────────────────

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
