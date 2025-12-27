import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { canEditLocation, canDeleteUserSave } from '@/lib/permissions';

/**
 * GET /api/locations/[id]
 * Get a single saved location by UserSave ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const userSave = await prisma.userSave.findUnique({
            where: { id },
            include: {
                location: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!userSave) {
            return apiError('Location not found', 404, 'NOT_FOUND');
        }

        // Check ownership
        if (userSave.userId !== user.id) {
            return apiError('Permission denied', 403, 'FORBIDDEN');
        }

        return apiResponse({ userSave });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return apiError('Authentication required', 401, 'UNAUTHORIZED');
        }
        console.error('Error fetching location:', error);
        return apiError('Failed to fetch location', 500, 'FETCH_ERROR');
    }
}

/**
 * PATCH /api/locations/[id]
 * Update location details (name, address, type, rating, address components, production details)
 * Only creator or admin can update
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();

        // Get the location
        const location = await prisma.location.findUnique({
            where: { id },
        });

        if (!location) {
            return apiError('Location not found', 404, 'NOT_FOUND');
        }

        // Check permission (creator OR admin)
        if (!canEditLocation(user, location)) {
            return apiError(
                'Permission denied. Only the creator or admin can edit this location.',
                403,
                'FORBIDDEN'
            );
        }

        // Update location with audit trail
        const updatedLocation = await prisma.location.update({
            where: { id },
            data: {
                // Basic info
                ...(body.name && { name: body.name }),
                ...(body.address && { address: body.address }),
                ...(body.type && { type: body.type }),
                ...(body.rating !== undefined && { rating: body.rating }),
                // Address components
                ...(body.street !== undefined && { street: body.street }),
                ...(body.number !== undefined && { number: body.number }),
                ...(body.city !== undefined && { city: body.city }),
                ...(body.state !== undefined && { state: body.state }),
                ...(body.zipcode !== undefined && { zipcode: body.zipcode }),
                // Production details
                ...(body.productionNotes !== undefined && { productionNotes: body.productionNotes }),
                ...(body.entryPoint !== undefined && { entryPoint: body.entryPoint }),
                ...(body.parking !== undefined && { parking: body.parking }),
                ...(body.access !== undefined && { access: body.access }),
                ...(body.indoorOutdoor !== undefined && { indoorOutdoor: body.indoorOutdoor }),
                // Metadata
                ...(body.isPermanent !== undefined && { isPermanent: body.isPermanent }),
                // Audit trail
                lastModifiedBy: user.id,
                lastModifiedAt: new Date(),
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                lastModifier: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Update UserSave fields if provided
        let userSave = null;
        const hasUserSaveUpdates = body.tags !== undefined ||
            body.isFavorite !== undefined ||
            body.personalRating !== undefined ||
            body.color !== undefined;

        if (hasUserSaveUpdates) {
            // Find user's save for this location
            const existingUserSave = await prisma.userSave.findFirst({
                where: {
                    userId: user.id,
                    locationId: id,
                },
            });

            if (existingUserSave) {
                userSave = await prisma.userSave.update({
                    where: { id: existingUserSave.id },
                    data: {
                        ...(body.tags !== undefined && { tags: body.tags }),
                        ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
                        ...(body.personalRating !== undefined && { personalRating: body.personalRating }),
                        ...(body.color !== undefined && { color: body.color }),
                    },
                });
            }
        }

        // Handle photo updates if provided
        if (body.photos && Array.isArray(body.photos)) {
            // Separate new photos from existing photos
            const newPhotos = body.photos.filter((photo: any) => !photo.id);
            const existingPhotos = body.photos.filter((photo: any) => photo.id);

            // Update existing photos (caption, isPrimary, etc.)
            for (const photo of existingPhotos) {
                await prisma.photo.update({
                    where: { id: photo.id },
                    data: {
                        caption: photo.caption || null,
                        isPrimary: photo.isPrimary || false,
                    },
                });
            }

            // Create new photos
            if (newPhotos.length > 0) {
                await prisma.photo.createMany({
                    data: newPhotos.map((photo: any, index: number) => ({
                        placeId: location.placeId,
                        userId: user.id,
                        imagekitFileId: photo.imagekitFileId,
                        imagekitFilePath: photo.imagekitFilePath,
                        originalFilename: photo.originalFilename,
                        fileSize: photo.fileSize,
                        mimeType: photo.mimeType,
                        width: photo.width,
                        height: photo.height,
                        isPrimary: index === 0 && body.photos.length === newPhotos.length, // Only set primary if all photos are new
                        caption: photo.caption || null,
                    })),
                });
            }
        }

        // Fetch updated location with photos to return
        const finalLocation = await prisma.location.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                lastModifier: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Fetch photos separately (Photo model uses placeId, not locationId FK)
        const photos = await prisma.photo.findMany({
            where: { placeId: location.placeId },
            orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
        });

        return apiResponse({
            location: { ...finalLocation, photos },
            userSave
        });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return apiError('Authentication required', 401, 'UNAUTHORIZED');
        }
        console.error('Error updating location:', error);
        return apiError('Failed to update location', 500, 'UPDATE_ERROR');
    }
}

/**
 * DELETE /api/locations/[id]
 * Remove location from user's saves (deletes UserSave only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        // Get the UserSave
        const userSave = await prisma.userSave.findUnique({
            where: { id },
        });

        if (!userSave) {
            return apiError('Saved location not found', 404, 'NOT_FOUND');
        }

        // Check ownership
        if (!canDeleteUserSave(user, userSave)) {
            return apiError('Permission denied', 403, 'FORBIDDEN');
        }

        // Delete the UserSave (keeps Location for other users)
        await prisma.userSave.delete({
            where: { id },
        });

        return apiResponse({ message: 'Location removed from saves' });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return apiError('Authentication required', 401, 'UNAUTHORIZED');
        }
        console.error('Error deleting location:', error);
        return apiError('Failed to delete location', 500, 'DELETE_ERROR');
    }
}
