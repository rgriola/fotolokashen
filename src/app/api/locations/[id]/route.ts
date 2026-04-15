import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { canEditLocation, canDeleteUserSave } from '@/lib/permissions';
import { sanitizeUserInput, sanitizeArray } from '@/lib/sanitize';

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
                        photos: {
                            orderBy: { uploadedAt: 'desc' },
                            select: {
                                id: true,
                                imagekitFilePath: true,
                                isPrimary: true,
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
                ...(body.name && { name: sanitizeUserInput(body.name) }),
                ...(body.address && { address: sanitizeUserInput(body.address) }),
                ...(body.type && { type: body.type }),
                ...(body.rating !== undefined && { rating: body.rating }),
                // Address components
                ...(body.street !== undefined && { street: sanitizeUserInput(body.street) }),
                ...(body.number !== undefined && { number: sanitizeUserInput(body.number) }),
                ...(body.city !== undefined && { city: sanitizeUserInput(body.city) }),
                ...(body.state !== undefined && { state: sanitizeUserInput(body.state) }),
                ...(body.zipcode !== undefined && { zipcode: sanitizeUserInput(body.zipcode) }),
                // Production details
                ...(body.productionDate !== undefined && { 
                    productionDate: body.productionDate ? new Date(body.productionDate) : null 
                }),
                ...(body.productionNotes !== undefined && { productionNotes: sanitizeUserInput(body.productionNotes) }),
                ...(body.entryPoint !== undefined && { entryPoint: sanitizeUserInput(body.entryPoint) }),
                ...(body.parking !== undefined && { parking: sanitizeUserInput(body.parking) }),
                ...(body.access !== undefined && { access: sanitizeUserInput(body.access) }),
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
            body.color !== undefined ||
            body.visibility !== undefined ||
            body.caption !== undefined;

        if (hasUserSaveUpdates) {
            // Find user's save for this location
            const existingUserSave = await prisma.userSave.findFirst({
                where: {
                    userId: user.id,
                    locationId: id,
                },
            });

            console.log('[PATCH /api/locations] UserSave lookup:', {
                userId: user.id,
                locationId: id,
                found: !!existingUserSave,
                userSaveId: existingUserSave?.id,
            });

            if (existingUserSave) {
                userSave = await prisma.userSave.update({
                    where: { id: existingUserSave.id },
                    data: {
                        ...(body.tags !== undefined && { tags: body.tags ? sanitizeArray(body.tags) : body.tags }),
                        ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
                        ...(body.personalRating !== undefined && { personalRating: body.personalRating }),
                        ...(body.color !== undefined && { color: body.color }),
                        ...(body.visibility !== undefined && { visibility: body.visibility }),
                        ...(body.caption !== undefined && { caption: sanitizeUserInput(body.caption) }),
                    },
                });
                console.log('[PATCH /api/locations] UserSave updated:', {
                    id: userSave.id,
                    visibility: userSave.visibility,
                });
            } else {
                console.error('[PATCH /api/locations] UserSave NOT FOUND for userId:', user.id, 'locationId:', id);
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
                        caption: photo.caption ? sanitizeUserInput(photo.caption) : null,
                        isPrimary: photo.isPrimary || false,
                    },
                });
            }

            // Create new photos
            if (newPhotos.length > 0) {
                await prisma.photo.createMany({
                    data: newPhotos.map((photo: any, index: number) => ({
                        locationId: location.id,  // Link to user's specific location
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
                        caption: photo.caption ? sanitizeUserInput(photo.caption) : null,
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
        console.log('\n========================================');
        console.log('🗑️  DELETE LOCATION - START');
        console.log('========================================');
        
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            console.log('❌ Authentication failed');
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        console.log(`📋 Request Details:`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   User Email: ${user.email}`);
        console.log(`   UserSave ID: ${id}`);

        // Get the UserSave with full details
        const userSave = await prisma.userSave.findUnique({
            where: { id },
            include: {
                location: {
                    include: {
                        photos: true,
                        savedBy: true,
                    }
                }
            }
        });

        if (!userSave) {
            console.log(`❌ UserSave not found with ID: ${id}`);
            return apiError('Saved location not found', 404, 'NOT_FOUND');
        }

        console.log(`\n✅ Found UserSave:`);
        console.log(`   UserSave ID: ${userSave.id}`);
        console.log(`   Location ID: ${userSave.locationId}`);
        console.log(`   Location Name: ${userSave.location.name}`);
        console.log(`   Location CreatedBy: ${userSave.location.createdBy}`);
        console.log(`   Photos Count: ${userSave.location.photos.length}`);
        console.log(`   Total Saves (by all users): ${userSave.location.savedBy.length}`);

        // Check ownership
        if (!canDeleteUserSave(user, userSave)) {
            console.log(`❌ Permission denied - UserSave belongs to user ${userSave.userId}`);
            return apiError('Permission denied', 403, 'FORBIDDEN');
        }

        console.log(`\n✅ Permission check passed`);

        // List photos before deletion
        if (userSave.location.photos.length > 0) {
            console.log(`\n📷 Photos associated with this location:`);
            userSave.location.photos.forEach((photo, index) => {
                console.log(`   ${index + 1}. Photo ID: ${photo.id}`);
                console.log(`      ImageKit File ID: ${photo.imagekitFileId}`);
                console.log(`      ImageKit Path: ${photo.imagekitFilePath}`);
                console.log(`      Uploaded by User ID: ${photo.userId}`);
                console.log(`      Primary: ${photo.isPrimary}`);
            });
        }

        // Check if this is the last user saving this location
        const otherSaves = userSave.location.savedBy.filter(save => save.id !== userSave.id);
        const isLastSave = otherSaves.length === 0;
        const isCreator = userSave.location.createdBy === user.id;

        console.log(`\n📊 Deletion Impact Analysis:`);
        console.log(`   Is user the creator? ${isCreator ? 'YES' : 'NO'}`);
        console.log(`   Is this the last save? ${isLastSave ? 'YES' : 'NO'}`);
        console.log(`   Other users with this location: ${otherSaves.length}`);
        
        if (isLastSave) {
            console.log(`\n⚠️  This is the LAST save of this location!`);
            if (isCreator) {
                console.log(`   ✅ User is the creator - FULL CASCADE DELETE will execute`);
                console.log(`   Will delete: UserSave + Location + ${userSave.location.photos.length} Photos (DB + ImageKit)`);
            } else {
                console.log(`   ⚠️  User is NOT the creator - only UserSave will be deleted`);
                console.log(`   Location ${userSave.locationId} will become orphaned`);
            }
        } else {
            console.log(`\n✅ Location will remain accessible to ${otherSaves.length} other user(s):`);
            otherSaves.forEach((save, index) => {
                console.log(`   ${index + 1}. UserSave ID: ${save.id}, User ID: ${save.userId}`);
            });
        }

        // CASCADE DELETE: If user is creator and it's the last save, delete everything
        if (isCreator && isLastSave) {
            console.log(`\n🗑️  CASCADE DELETE INITIATED (user owns this location)...`);
            
            // Step 1: Delete photos from ImageKit
            if (userSave.location.photos.length > 0) {
                console.log(`\n📷 Deleting ${userSave.location.photos.length} photos from ImageKit...`);
                
                // Initialize ImageKit
                const ImageKit = (await import('imagekit')).default;
                const imagekit = new ImageKit({
                    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
                    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
                    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
                });

                for (const photo of userSave.location.photos) {
                    try {
                        await imagekit.deleteFile(photo.imagekitFileId);
                        console.log(`   ✅ Deleted photo ${photo.id} (${photo.imagekitFileId}) from ImageKit`);
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        console.error(`   ❌ Failed to delete photo ${photo.id} from ImageKit: ${errorMessage}`);
                    }
                }
            }

            // Step 2: Delete location (cascade will handle photos in DB and UserSaves)
            console.log(`\n🗑️  Deleting Location ${userSave.locationId} from database...`);
            await prisma.location.delete({
                where: { id: userSave.locationId }
            });
            console.log(`   ✅ Location deleted (cascade deleted ${userSave.location.photos.length} photo records and UserSave ${id})`);

            console.log(`\n📝 Final Database State:`);
            console.log(`   ✅ UserSave ${id} - DELETED (cascade)`);
            console.log(`   ✅ Location ${userSave.locationId} - DELETED`);
            console.log(`   ✅ Photos (${userSave.location.photos.length}) - DELETED from database`);
            console.log(`   ✅ Photos (${userSave.location.photos.length}) - DELETED from ImageKit`);

        } else {
            // Just delete the UserSave (keeps Location for other users or non-creators)
            console.log(`\n🗑️  Deleting UserSave ID: ${id} only...`);
            await prisma.userSave.delete({
                where: { id },
            });
            console.log(`✅ UserSave deleted successfully`);

            console.log(`\n📝 Database State After Deletion:`);
            console.log(`   ✅ UserSave ${id} - DELETED`);
            console.log(`   ⚠️  Location ${userSave.locationId} - PRESERVED (${isCreator ? 'user is creator but not last save' : 'user is not creator'})`);
            console.log(`   ⚠️  Photos (${userSave.location.photos.length}) - PRESERVED`);

            if (!isCreator && isLastSave) {
                console.log(`\n🚨 ORPHANED LOCATION DETECTED:`);
                console.log(`   Location ID ${userSave.locationId} has no remaining saves`);
                console.log(`   Created by User ID: ${userSave.location.createdBy} (not current user)`);
                console.log(`   ${userSave.location.photos.length} photo(s) are orphaned`);
                console.log(`   Consider notifying creator or implementing cleanup policy`);
            }
        }

        console.log('\n========================================');
        console.log('✅ DELETE LOCATION - COMPLETE');
        console.log('========================================\n');

        return apiResponse({ 
            message: isCreator && isLastSave 
                ? 'Location and all associated photos deleted successfully' 
                : 'Location removed from your saves',
            deleted: {
                userSave: true,
                location: isCreator && isLastSave,
                photos: isCreator && isLastSave ? userSave.location.photos.length : 0,
                imagekitFiles: isCreator && isLastSave ? userSave.location.photos.length : 0
            }
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage === 'UNAUTHORIZED') {
            console.log('❌ Unauthorized error');
            return apiError('Authentication required', 401, 'UNAUTHORIZED');
        }
        console.error('\n❌ ERROR in DELETE handler:');
        console.error(error);
        console.log('\n========================================\n');
        return apiError('Failed to delete location', 500, 'DELETE_ERROR');
    }
}
