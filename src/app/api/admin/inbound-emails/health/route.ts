import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import prisma from '@/lib/prisma';

const HEALTH_WINDOW_HOURS = 24;

/**
 * GET /api/admin/inbound-emails/health
 * Aggregated inbox health metrics for monitoring failed forwards and recent inbound activity.
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
    const now = new Date();
    const since = new Date(now.getTime() - HEALTH_WINDOW_HOURS * 60 * 60 * 1000);

    const [inboundReceived, forwardOk, forwardFailed, forwardNotConfigured, lastInbound] = await Promise.all([
      prisma.inboundEmail.count({
        where: {
          receivedAt: { gte: since },
        },
      }),
      prisma.inboundEmail.count({
        where: {
          receivedAt: { gte: since },
          forwardStatus: 'ok',
        },
      }),
      prisma.inboundEmail.count({
        where: {
          receivedAt: { gte: since },
          forwardStatus: 'failed',
        },
      }),
      prisma.inboundEmail.count({
        where: {
          receivedAt: { gte: since },
          forwardStatus: 'not_configured',
        },
      }),
      prisma.inboundEmail.findFirst({
        orderBy: {
          receivedAt: 'desc',
        },
        select: {
          id: true,
          subject: true,
          toCsv: true,
          receivedAt: true,
          forwardStatus: true,
          forwardError: true,
        },
      }),
    ]);

    const status = forwardFailed > 0 || forwardNotConfigured > 0 ? 'warning' : 'healthy';

    return apiResponse({
      windowHours: HEALTH_WINDOW_HOURS,
      generatedAt: now.toISOString(),
      status,
      metrics: {
        inboundReceived,
        forwardOk,
        forwardFailed,
        forwardNotConfigured,
      },
      lastInbound: lastInbound
        ? {
            ...lastInbound,
            receivedAt: lastInbound.receivedAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching inbound email health:', error);
    return apiError('Failed to fetch inbound email health', 500);
  }
}
