import { NextRequest } from 'next/server';
import { apiError, apiResponse } from '@/lib/api-middleware';
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

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INBOUND_ALERT_CRON_TOKEN;
  if (!secret) {
    return false;
  }

  const token = extractBearerToken(req);
  return Boolean(token && token === secret);
}

/**
 * GET /api/cron/inbound-email-forward-alert
 * Scheduled check that sends Slack alert when failed/not-configured forwarding is detected.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return apiError('Unauthorized cron request', 401, 'CRON_UNAUTHORIZED');
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
    const force = searchParams.get('force') === 'true';

    const snapshot = await loadInboundForwardSnapshot(windowHours, sampleLimit);

    if (!snapshot.shouldAlert && !force) {
      return apiResponse({
        sent: false,
        skipped: true,
        reason: 'No failed or not-configured forwards in alert window.',
        snapshot,
      });
    }

    const slackWebhookUrl = getInboundAlertSlackWebhookUrl();
    if (!slackWebhookUrl) {
      return apiError('SLACK_WEBHOOK_URL is not configured', 503, 'ALERT_CHANNEL_NOT_CONFIGURED');
    }

    const slackText = buildInboundForwardSlackText(snapshot);
    await sendSlackAlert(slackWebhookUrl, slackText);

    return apiResponse({
      sent: true,
      channel: 'slack',
      snapshot,
    });
  } catch (error) {
    console.error('Error executing inbound email alert cron:', error);
    return apiError('Failed to execute inbound email alert cron', 500, 'CRON_EXECUTION_ERROR');
  }
}
