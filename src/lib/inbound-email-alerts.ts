import prisma from '@/lib/prisma';
import { env } from '@/lib/env';

export const INBOUND_ALERT_DEFAULT_WINDOW_HOURS = 24;
export const INBOUND_ALERT_MAX_WINDOW_HOURS = 7 * 24;
export const INBOUND_ALERT_DEFAULT_FAILURE_LIMIT = 10;
export const INBOUND_ALERT_MAX_FAILURE_LIMIT = 50;

export interface FailedForwardSample {
  id: number;
  subject: string;
  fromRaw: string;
  toCsv: string;
  receivedAt: string;
  forwardStatus: string | null;
  forwardError: string | null;
}

export interface FailedForwardSnapshot {
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

export function parsePositiveInt(value: string | null | undefined, fallback: number, max: number): number {
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

export function buildInboundForwardSlackText(snapshot: FailedForwardSnapshot): string {
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

export async function loadInboundForwardSnapshot(
  windowHours: number,
  sampleLimit: number
): Promise<FailedForwardSnapshot> {
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

export function getInboundAlertSlackWebhookUrl(): string | null {
  return env.SLACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || null;
}

export async function sendSlackAlert(webhookUrl: string, text: string): Promise<void> {
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
