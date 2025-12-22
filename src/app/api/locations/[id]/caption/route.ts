import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';
import { canUpdateCaption } from '@/lib/permissions';

/**
 * PATCH /api/locations/[id]/caption
 * Update the user's caption for a saved location
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

        const { caption } = body;

        // Get the UserSave
        const userSave = await prisma.userSave.findUnique({
            where: { id },
        });

        if (!userSave) {
            return apiError('Saved location not found', 404, 'NOT_FOUND');
        }

        // Check permission
        if (!canUpdateCaption(user, userSave)) {
            return apiError('Permission denied', 403, 'FORBIDDEN');
        }

        // Update caption
        const updatedUserSave = await prisma.userSave.update({
            where: { id },
            data: { caption },
            include: {
                location: true,
            },
        });

        return apiResponse({ userSave: updatedUserSave });
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            return apiError('Authentication required', 401, 'UNAUTHORIZED');
        }
        console.error('Error updating caption:', error);
        return apiError('Failed to update caption', 500, 'UPDATE_ERROR');
    }
}
