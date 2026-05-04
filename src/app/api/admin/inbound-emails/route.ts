import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { env } from '@/lib/env';

const FORWARD_STATUS_VALUES = new Set(['all', 'ok', 'failed', 'not_configured']);

/**
 * GET /api/admin/inbound-emails
 * List inbound emails with paging, search, support-only filter, and forwarding status filter.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '20', 10)));
    const search = (searchParams.get('search') || '').trim();
    const supportOnly = searchParams.get('supportOnly') !== 'false';

    const requestedForwardStatus = (searchParams.get('forwardStatus') || 'all').toLowerCase();
    const forwardStatus = FORWARD_STATUS_VALUES.has(requestedForwardStatus)
      ? requestedForwardStatus
      : 'all';

    const configuredSupportAddress = (env.EMAIL_REPLY_TO || process.env.EMAIL_REPLY_TO || '').trim().toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const andConditions: any[] = [];

    if (supportOnly) {
      if (configuredSupportAddress) {
        andConditions.push({
          OR: [
            { toCsv: { contains: configuredSupportAddress, mode: 'insensitive' } },
            { forwardedToCsv: { contains: configuredSupportAddress, mode: 'insensitive' } },
          ],
        });
      } else {
        andConditions.push({
          OR: [
            { toCsv: { contains: 'support@', mode: 'insensitive' } },
            { subject: { contains: 'support', mode: 'insensitive' } },
          ],
        });
      }
    }

    if (forwardStatus !== 'all') {
      andConditions.push({
        forwardStatus,
      });
    }

    if (search) {
      andConditions.push({
        OR: [
          { fromRaw: { contains: search, mode: 'insensitive' } },
          { fromEmail: { contains: search, mode: 'insensitive' } },
          { fromName: { contains: search, mode: 'insensitive' } },
          { toCsv: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { textBody: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    const [totalItems, inboundEmails] = await Promise.all([
      prisma.inboundEmail.count({ where }),
      prisma.inboundEmail.findMany({
        where,
        orderBy: {
          receivedAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          providerEmailId: true,
          providerMessageId: true,
          fromRaw: true,
          fromEmail: true,
          fromName: true,
          toCsv: true,
          subject: true,
          receivedAt: true,
          forwardConfigured: true,
          forwardStatus: true,
          forwardedToCsv: true,
          forwardedFrom: true,
          forwardError: true,
          createdAt: true,
          _count: {
            select: {
              attachments: true,
            },
          },
        },
      }),
    ]);

    return apiResponse({
      items: inboundEmails.map((email) => ({
        ...email,
        receivedAt: email.receivedAt.toISOString(),
        createdAt: email.createdAt.toISOString(),
      })),
      pagination: {
        page,
        perPage,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
      },
      filters: {
        supportOnly,
        forwardStatus,
        search,
      },
    });
  } catch (error) {
    console.error('Error fetching inbound emails:', error);
    return apiError('Failed to fetch inbound emails', 500);
  }
}
