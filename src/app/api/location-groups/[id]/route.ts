import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth, withAuth } from '@/lib/api-middleware';
import { sanitizeUserInput } from '@/lib/sanitize';
import type { PublicUser } from '@/types/user';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/location-groups/[id]
 * Get a single location group with all child locations
 */
export const GET = withAuth(async (request: NextRequest, user: PublicUser, { params }: RouteParams) => {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) {
        return apiError('Invalid group ID', 400, 'VALIDATION_ERROR');
    }

    const group = await prisma.locationGroup.findFirst({
        where: {
            id: groupId,
            createdBy: user.id,
        },
        include: {
            locations: {
                include: {
                    photos: {
                        orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
                    },
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
            _count: {
                select: { locations: true },
            },
        },
    });

    if (!group) {
        return apiError('Location group not found', 404, 'NOT_FOUND');
    }

    return apiResponse({
        group: {
            ...group,
            locationCount: group._count.locations,
            _count: undefined,
        },
    });
});

/**
 * PATCH /api/location-groups/[id]
 * Update group metadata (name, type, description, coverPhotoId)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const { id } = await params;
        const groupId = parseInt(id, 10);
        if (isNaN(groupId)) {
            return apiError('Invalid group ID', 400, 'VALIDATION_ERROR');
        }

        const user = authResult.user;

        // Verify ownership
        const existing = await prisma.locationGroup.findFirst({
            where: { id: groupId, createdBy: user.id },
        });
        if (!existing) {
            return apiError('Location group not found', 404, 'NOT_FOUND');
        }

        const body = await request.json();
        const data: any = {};

        if (body.name !== undefined) {
            data.name = sanitizeUserInput(body.name);
            if (data.name.length > 100) {
                return apiError('Group name must be 100 characters or less', 400, 'VALIDATION_ERROR');
            }
        }
        if (body.type !== undefined) {
            data.type = body.type ? sanitizeUserInput(body.type) : null;
        }
        if (body.description !== undefined) {
            data.description = body.description ? sanitizeUserInput(body.description) : null;
            if (data.description && data.description.length > 500) {
                return apiError('Description must be 500 characters or less', 400, 'VALIDATION_ERROR');
            }
        }
        if (body.coverPhotoId !== undefined) {
            data.coverPhotoId = body.coverPhotoId;
        }
        if (body.startTime !== undefined) {
            data.startTime = body.startTime ? new Date(body.startTime) : null;
        }
        if (body.endTime !== undefined) {
            data.endTime = body.endTime ? new Date(body.endTime) : null;
        }

        const group = await prisma.locationGroup.update({
            where: { id: groupId },
            data,
            include: {
                _count: { select: { locations: true } },
            },
        });

        return apiResponse({
            group: {
                ...group,
                locationCount: group._count.locations,
                _count: undefined,
            },
        });
    } catch (error: any) {
        console.error('Error updating location group:', error);
        return apiError(error.message || 'Failed to update group', 500, 'UPDATE_ERROR');
    }
}

/**
 * DELETE /api/location-groups/[id]
 * Delete a group (locations remain, their groupId is set to null)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const { id } = await params;
        const groupId = parseInt(id, 10);
        if (isNaN(groupId)) {
            return apiError('Invalid group ID', 400, 'VALIDATION_ERROR');
        }

        const user = authResult.user;

        // Verify ownership
        const existing = await prisma.locationGroup.findFirst({
            where: { id: groupId, createdBy: user.id },
        });
        if (!existing) {
            return apiError('Location group not found', 404, 'NOT_FOUND');
        }

        // Unlink locations first (set groupId to null), then delete group
        await prisma.$transaction([
            prisma.location.updateMany({
                where: { groupId },
                data: { groupId: null },
            }),
            prisma.locationGroup.delete({
                where: { id: groupId },
            }),
        ]);

        return apiResponse({ message: 'Group deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting location group:', error);
        return apiError(error.message || 'Failed to delete group', 500, 'DELETE_ERROR');
    }
}
