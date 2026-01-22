import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import { duplicateTemplate, getEmailTemplate } from '@/lib/email-template-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/admin/email-templates/[id]/duplicate
 * Duplicate an email template
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
    return apiError('Super admin access required to duplicate templates', 403);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return apiError('Invalid template ID', 400);
    }

    const body = await req.json();
    const { newKey, newName } = body;

    if (!newKey || typeof newKey !== 'string') {
      return apiError('newKey is required and must be a string', 400);
    }

    if (!newName || typeof newName !== 'string') {
      return apiError('newName is required and must be a string', 400);
    }

    // Validate key format
    const keyRegex = /^[a-z0-9_-]+$/;
    if (!keyRegex.test(newKey)) {
      return apiError(
        'Template key must contain only lowercase letters, numbers, underscores, and hyphens',
        400
      );
    }

    // Check if key already exists
    const existing = await getEmailTemplate(newKey);
    if (existing) {
      return apiError(`Template with key "${newKey}" already exists`, 409);
    }

    const duplicated = await duplicateTemplate(id, newKey, newName, authResult.user.id);

    return apiResponse({
      message: 'Template duplicated successfully',
      template: duplicated,
    });
  } catch (error) {
    console.error('Error duplicating template:', error);

    if (error instanceof Error) {
      return apiError(error.message, 400);
    }

    return apiError('Failed to duplicate template', 500);
  }
}
