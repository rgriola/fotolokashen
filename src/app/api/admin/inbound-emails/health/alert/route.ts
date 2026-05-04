import { NextRequest } from 'next/server';
import { apiError, apiResponse, requireAuth } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import {
  buildInboundForwardSlackText,
  getInboundAlertSlackWebhookUrl,
  INBOUND_ALERT_DEFAULT_FAILURE_LIMIT,
  INBOUND_ALERT_DEFAULT_WINDOW_HOURS,
  INBOUND_ALERT_MAX_FAILURE_LIMIT,
  INBOUND_ALERT_MAX_WINDOW_HOURS,
  loadInboundForwardSnapshot,
  parsePositiveInt,
  sendSlackAlert,
} from '@/lib/inbound-email-alerts';

function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

async function requireAdminAccess(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || process.env.INBOUND_ALERT_CRON_TOKEN;
  const bearerToken = extractBearerToken(req);
  if (cronSecret && bearerToken && bearerToken === cronSecret) {
    return { ok: true as const, actor: 'cron' as const };
  }

  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return { ok: false as const, response: apiError('Unauthorized', 401) };
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return { ok: false as const, response: apiError('Admin access required', 403) };
  }

  return { ok: true as const, actor: 'admin' as const };
}

/**
 * GET /api/admin/inbound-emails/health/alert
 * Returns alert snapshot payload for failed/not-configured forwarding states.
 */
export async function GET(req: NextRequest) {
  const access = await requireAdminAccess(req);
  if (!access.ok) {
    return access.response;
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const windowHours = parsePositiveInt(
      searchParams.get('windowHours'),
      INBOUND_ALERT_DEFAULT_WINDOW_HOURS,
      INBOUND_ALERT_MAX_WINDOW_HOURS
    );
    const sampleLimit = parsePositiveInt(
      searchParams.get('limit'),
      INBOUND_ALERT_DEFAULT_FAILURE_LIMIT,
      INBOUND_ALERT_MAX_FAILURE_LIMIT
    );

    const snapshot = await loadInboundForwardSnapshot(windowHours, sampleLimit);
    const slackConfigured = Boolean(getInboundAlertSlackWebhookUrl());

    return apiResponse({
      ...snapshot,
      channels: {
        slackConfigured,
      },
    });
  } catch (error) {
    console.error('Error generating inbound alert snapshot:', error);
    return apiError('Failed to generate alert snapshot', 500);
  }
}

/**
 * POST /api/admin/inbound-emails/health/alert
 * Sends failed-forward alert to Slack when configured.
 */
export async function POST(req: NextRequest) {
  const access = await requireAdminAccess(req);
  if (!access.ok) {
    return access.response;
  }

  try {
    const body = await req.json().catch(() => ({}));

    const windowHours = parsePositiveInt(
      typeof body?.windowHours === 'number' ? String(body.windowHours) : undefined,
      INBOUND_ALERT_DEFAULT_WINDOW_HOURS,
      INBOUND_ALERT_MAX_WINDOW_HOURS
    );
    const sampleLimit = parsePositiveInt(
      typeof body?.limit === 'number' ? String(body.limit) : undefined,
      INBOUND_ALERT_DEFAULT_FAILURE_LIMIT,
      INBOUND_ALERT_MAX_FAILURE_LIMIT
    );
    const dryRun = Boolean(body?.dryRun);
    const force = Boolean(body?.force);

    const snapshot = await loadInboundForwardSnapshot(windowHours, sampleLimit);
    const slackWebhookUrl = getInboundAlertSlackWebhookUrl();

    if (!snapshot.shouldAlert && !force) {
      return apiResponse({
        sent: false,
        skipped: true,
        reason: 'No failed or not-configured forwards in the alert window.',
        snapshot,
      });
    }

    if (!slackWebhookUrl) {
      return apiError('SLACK_WEBHOOK_URL is not configured', 503, 'ALERT_CHANNEL_NOT_CONFIGURED');
    }

    const slackText = buildInboundForwardSlackText(snapshot);

    if (dryRun) {
      return apiResponse({
        sent: false,
        dryRun: true,
        preview: slackText,
        snapshot,
      });
    }

    await sendSlackAlert(slackWebhookUrl, slackText);

    return apiResponse({
      sent: true,
      channel: 'slack',
      snapshot,
    });
  } catch (error) {
    console.error('Error sending inbound alert:', error);
    return apiError('Failed to send inbound alert', 500);
  }
}
