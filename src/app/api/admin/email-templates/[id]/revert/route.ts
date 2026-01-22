import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import { revertToVersion } from '@/lib/email-template-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/admin/email-templates/[id]/revert
 * Revert template to a previous version
 * Super admin only
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  // Super admin only
  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required to revert templates', 403);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return apiError('Invalid template ID', 400);
    }

    const body = await req.json();

    if (!body.version || typeof body.version !== 'number') {
      return apiError('Version number is required', 400);
    }

    const template = await revertToVersion(id, body.version, authResult.user.id);

    return apiResponse({
      template,
      message: `Template reverted to version ${body.version}`,
    });
  } catch (error) {
    console.error('Error reverting template:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return apiError(error.message, 404);
      }
      if (error.message.includes('Cannot revert default')) {
        return apiError(error.message, 403);
      }
      return apiError(error.message, 400);
    }

    return apiError('Failed to revert template', 500);
  }
}
