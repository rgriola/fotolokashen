import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import { getTemplateById } from '@/lib/email-template-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/email-templates/[id]/versions
 * Get version history for a template
 * Super admin only
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return apiError('Invalid template ID', 400);
    }

    const template = await getTemplateById(id);

    if (!template) {
      return apiError('Template not found', 404);
    }

    return apiResponse({
      versions: template.versions,
      currentVersion: template.version as number,
    });
  } catch (error) {
    console.error('Error fetching template versions:', error);
    return apiError('Failed to fetch template versions', 500);
  }
}
