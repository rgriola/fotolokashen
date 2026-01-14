import { NextRequest } from 'next/server';
import { requireAuth, apiError, apiResponse } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    
    if (!authResult.authorized || !authResult.user) {
      return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const user = authResult.user;
    const { id } = await params;
    const body = await req.json();
    const { visibility } = body;

    // Validate visibility value
    if (!visibility || !['public', 'private', 'followers'].includes(visibility)) {
      return apiError('Invalid visibility value. Must be public, private, or followers', 400);
    }

    // Get the location save
    const userSave = await prisma.userSave.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!userSave) {
      return apiError('Location not found', 404);
    }

    // Verify ownership
    if (userSave.userId !== user.id) {
      return apiError('Forbidden', 403);
    }

    // Update visibility
    const updatedSave = await prisma.userSave.update({
      where: {
        id: parseInt(id),
      },
      data: {
        visibility,
      },
      select: {
        id: true,
        visibility: true,
      },
    });

    return apiResponse({
      success: true,
      visibility: updatedSave.visibility,
    });
  } catch (error) {
    console.error('Error updating visibility:', error);
    return apiError('Failed to update visibility', 500);
  }
}
