import { NextRequest } from 'next/server';
import { apiError, apiResponse, requireAuth } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { env } from '@/lib/env';

const DEFAULT_WINDOW_HOURS = 24;
const MAX_WINDOW_HOURS = 7 * 24;
const DEFAULT_FAILURE_LIMIT = 10;
const MAX_FAILURE_LIMIT = 50;

interface FailedForwardSample {
  id: number;
  subject: string;
  fromRaw: string;
  toCsv: string;
  receivedAt: string;
  forwardStatus: string | null;
  forwardError: string | null;
}

interface FailedForwardSnapshot {
  generatedAt: string;
  windowHours: number;
  shouldAlert: boolean;
  metrics: {
    inboundReceived: number;
    forwardFailed: number;
    forwardNotConfigured: number;
  };
  samples: FailedForwardSample[];
}

function parsePositiveInt(value: string | null | undefined, fallback: number, max: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function cleanSingleLine(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildSlackText(snapshot: FailedForwardSnapshot): string {
  const lines: string[] = [];
  const level = snapshot.shouldAlert ? ':warning:' : ':white_check_mark:';

  lines.push(`${level} Inbound Email Health (${snapshot.windowHours}h)`);
  lines.push(`Generated: ${snapshot.generatedAt}`);
  lines.push(`Inbound received: ${snapshot.metrics.inboundReceived}`);
  lines.push(`Forward failed: ${snapshot.metrics.forwardFailed}`);
  lines.push(`Forward not configured: ${snapshot.metrics.forwardNotConfigured}`);

  if (snapshot.samples.length > 0) {
    lines.push('Recent failed/not-configured samples:');
    for (const sample of snapshot.samples) {
      const subject = cleanSingleLine(sample.subject) || '(no subject)';
      const recipient = cleanSingleLine(sample.toCsv) || 'unknown recipient';
      const status = cleanSingleLine(sample.forwardStatus) || 'unknown';
      const error = cleanSingleLine(sample.forwardError) || 'none';
      lines.push(`- #${sample.id} [${status}] to ${recipient} | ${subject} | error: ${error}`);
    }
  }

  return lines.join('\n');
}

async function loadSnapshot(windowHours: number, sampleLimit: number): Promise<FailedForwardSnapshot> {
  const now = new Date();
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  const [inboundReceived, forwardFailed, forwardNotConfigured, samples] = await Promise.all([
    prisma.inboundEmail.count({
      where: {
        receivedAt: { gte: since },
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
    prisma.inboundEmail.findMany({
      where: {
        receivedAt: { gte: since },
        OR: [{ forwardStatus: 'failed' }, { forwardStatus: 'not_configured' }],
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: sampleLimit,
      select: {
        id: true,
        subject: true,
        fromRaw: true,
        toCsv: true,
        receivedAt: true,
        forwardStatus: true,
        forwardError: true,
      },
    }),
  ]);

  return {
    generatedAt: now.toISOString(),
    windowHours,
    shouldAlert: forwardFailed > 0 || forwardNotConfigured > 0,
    metrics: {
      inboundReceived,
      forwardFailed,
      forwardNotConfigured,
    },
    samples: samples.map((sample) => ({
      ...sample,
      receivedAt: sample.receivedAt.toISOString(),
    })),
  };
}

async function sendSlackAlert(webhookUrl: string, text: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack alert send failed (${response.status}): ${body.slice(0, 200)}`);
  }
}

async function requireAdminAccess(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return { ok: false as const, response: apiError('Unauthorized', 401) };
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return { ok: false as const, response: apiError('Admin access required', 403) };
  }

  return { ok: true as const };
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
    const windowHours = parsePositiveInt(searchParams.get('windowHours'), DEFAULT_WINDOW_HOURS, MAX_WINDOW_HOURS);
    const sampleLimit = parsePositiveInt(searchParams.get('limit'), DEFAULT_FAILURE_LIMIT, MAX_FAILURE_LIMIT);

    const snapshot = await loadSnapshot(windowHours, sampleLimit);
    const slackConfigured = Boolean(env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL);

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
      DEFAULT_WINDOW_HOURS,
      MAX_WINDOW_HOURS
    );
    const sampleLimit = parsePositiveInt(
      typeof body?.limit === 'number' ? String(body.limit) : undefined,
      DEFAULT_FAILURE_LIMIT,
      MAX_FAILURE_LIMIT
    );
    const dryRun = Boolean(body?.dryRun);
    const force = Boolean(body?.force);

    const snapshot = await loadSnapshot(windowHours, sampleLimit);
    const slackWebhookUrl = env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

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

    const slackText = buildSlackText(snapshot);

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
