import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '@/lib/email-template-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/email-templates/[id]
 * Get single email template with version history
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

    return apiResponse({ template });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return apiError('Failed to fetch email template', 500);
  }
}

/**
 * PUT /api/admin/email-templates/[id]
 * Update email template (creates new version)
 * Super admin only
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  // Super admin only for updating templates
  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required to update templates', 403);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return apiError('Invalid template ID', 400);
    }

    const body = await req.json();

    const template = await updateTemplate(
      id,
      {
        name: body.name,
        description: body.description,
        category: body.category,
        subject: body.subject,
        htmlBody: body.htmlBody,
        textBody: body.textBody,
        previewText: body.previewText,
        brandColor: body.brandColor,
        headerGradientStart: body.headerGradientStart,
        headerGradientEnd: body.headerGradientEnd,
        buttonColor: body.buttonColor,
        requiredVariables: body.requiredVariables,
        changeNote: body.changeNote,
      },
      authResult.user.id
    );

    return apiResponse({
      template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Error updating email template:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return apiError(error.message, 404);
      }
      if (error.message.includes('Cannot modify default')) {
        return apiError(error.message, 403);
      }
      return apiError(error.message, 400);
    }

    return apiError('Failed to update email template', 500);
  }
}

/**
 * DELETE /api/admin/email-templates/[id]
 * Soft delete email template (custom templates only)
 * Super admin only
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  // Super admin only for deleting templates
  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required to delete templates', 403);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return apiError('Invalid template ID', 400);
    }

    await deleteTemplate(id, authResult.user.id);

    return apiResponse({
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email template:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return apiError(error.message, 404);
      }
      if (error.message.includes('Cannot delete default')) {
        return apiError(error.message, 403);
      }
      return apiError(error.message, 400);
    }

    return apiError('Failed to delete email template', 500);
  }
}
