import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/inbound-emails/[id]
 * Fetch full inbound email record and attachment metadata.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(id)) {
      return apiError('Invalid inbound email id', 400);
    }

    const email = await prisma.inboundEmail.findUnique({
      where: { id },
      include: {
        attachments: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!email) {
      return apiError('Inbound email not found', 404);
    }

    return apiResponse({
      email: {
        ...email,
        receivedAt: email.receivedAt.toISOString(),
        rawExpiresAt: email.rawExpiresAt?.toISOString() || null,
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching inbound email detail:', error);
    return apiError('Failed to fetch inbound email detail', 500);
  }
}
