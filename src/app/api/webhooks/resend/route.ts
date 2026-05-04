import { NextRequest } from 'next/server';
import { Resend, type WebhookEventPayload } from 'resend';
import prisma from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-middleware';
import { env } from '@/lib/env';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = env.EMAIL_API_KEY || process.env.EMAIL_API_KEY;
  if (!apiKey) {
    throw new Error('EMAIL_API_KEY is not configured');
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

const INBOUND_FORWARD_RECIPIENTS = (env.RESEND_INBOUND_FORWARD_TO || process.env.RESEND_INBOUND_FORWARD_TO || '')
  .split(',')
  .map((address) => address.trim())
  .filter(Boolean);
const INBOUND_FORWARD_FROM =
  env.RESEND_INBOUND_FORWARD_FROM || process.env.RESEND_INBOUND_FORWARD_FROM || env.EMAIL_FROM_ADDRESS;

type EmailWebhookEvent = Extract<WebhookEventPayload, { type: `email.${string}` }>;

interface InboundForwardResult {
  attempted: boolean;
  configured: boolean;
  forwarded: boolean;
  metadata: string[];
  toRecipients: string[];
  fromAddress: string | null;
  forwardProviderId: string | null;
  error: string | null;
}

interface ResendInboundAttachment {
  id: string;
  filename: string | null;
  size: number;
  content_type: string;
  content_id: string | null;
  content_disposition: string | null;
}

interface ResendInboundEmail {
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  html: string | null;
  text: string | null;
  headers: Record<string, string> | null;
  message_id: string;
  raw?: {
    download_url: string;
    expires_at: string;
  } | null;
  attachments: ResendInboundAttachment[];
}

const EMAIL_EVENT_STATUS_MAP: Partial<Record<WebhookEventPayload['type'], string>> = {
  'email.sent': 'sent',
  'email.scheduled': 'queued',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delivery_delayed',
  'email.complained': 'complained',
  'email.bounced': 'bounced',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.received': 'received',
  'email.failed': 'failed',
  'email.suppressed': 'suppressed',
};

function getWebhookHeaders(request: NextRequest) {
  const id =
    request.headers.get('svix-id') ||
    request.headers.get('webhook-id') ||
    request.headers.get('resend-id');
  const timestamp =
    request.headers.get('svix-timestamp') ||
    request.headers.get('webhook-timestamp') ||
    request.headers.get('resend-timestamp');
  const signature =
    request.headers.get('svix-signature') ||
    request.headers.get('webhook-signature') ||
    request.headers.get('resend-signature') ||
    request.headers.get('x-resend-signature');

  return { id, timestamp, signature };
}

function parseEventDate(createdAt: string): Date {
  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function splitRecipients(input: string[] | null | undefined): string[] {
  return (input || []).map((entry) => entry.trim()).filter(Boolean);
}

function joinRecipients(input: string[] | null | undefined): string {
  return splitRecipients(input).join(',');
}

function findHeaderValue(headers: Record<string, string> | null | undefined, headerName: string): string | null {
  if (!headers) {
    return null;
  }

  const targetName = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === targetName) {
      return value;
    }
  }

  return null;
}

function parseSenderAddress(fromRaw: string): { fromName: string | null; fromEmail: string | null } {
  const trimmed = fromRaw.trim();
  const bracketMatch = trimmed.match(/^(.*)<([^<>]+)>$/);
  if (bracketMatch) {
    const fromName = bracketMatch[1].trim().replace(/^"|"$/g, '');
    const fromEmail = bracketMatch[2].trim();
    return {
      fromName: fromName || null,
      fromEmail: fromEmail || null,
    };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return {
      fromName: null,
      fromEmail: trimmed,
    };
  }

  return {
    fromName: trimmed || null,
    fromEmail: null,
  };
}

function sanitizeMetadataValue(value: string): string {
  return value.replace(/[;\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapEventStatus(eventType: WebhookEventPayload['type']): string {
  return EMAIL_EVENT_STATUS_MAP[eventType] || 'webhook_received';
}

function isEmailEvent(
  event: WebhookEventPayload
): event is EmailWebhookEvent {
  return event.type.startsWith('email.');
}

function getEventMetadataLine(
  event: EmailWebhookEvent,
  webhookId: string,
  extraMetadata: string[] = []
): string {
  const data = event.data as {
    email_id?: string;
    from?: string;
    to?: string[];
    bounce?: { message?: string; type?: string; subType?: string };
    failed?: { reason?: string };
    suppressed?: { message?: string; type?: string };
  };

  const metadataParts = [
    'provider=resend',
    `messageId=${data.email_id || 'unknown'}`,
    `webhookId=${webhookId}`,
    `event=${event.type}`,
    `eventCreatedAt=${event.created_at}`,
  ];

  if (event.type === 'email.bounced' && data.bounce) {
    if (data.bounce.message) {
      metadataParts.push(`bounceMessage=${sanitizeMetadataValue(data.bounce.message)}`);
    }
    if (data.bounce.type) {
      metadataParts.push(`bounceType=${data.bounce.type}`);
    }
    if (data.bounce.subType) {
      metadataParts.push(`bounceSubType=${data.bounce.subType}`);
    }
  }

  if (event.type === 'email.failed' && data.failed?.reason) {
    metadataParts.push(`failureReason=${sanitizeMetadataValue(data.failed.reason)}`);
  }

  if (event.type === 'email.suppressed' && data.suppressed) {
    if (data.suppressed.message) {
      metadataParts.push(`suppressedMessage=${sanitizeMetadataValue(data.suppressed.message)}`);
    }
    if (data.suppressed.type) {
      metadataParts.push(`suppressedType=${data.suppressed.type}`);
    }
  }

  if (event.type === 'email.received') {
    if (data.from) {
      metadataParts.push(`inboundFrom=${sanitizeMetadataValue(data.from)}`);
    }
    if (Array.isArray(data.to) && data.to.length > 0) {
      metadataParts.push(`inboundTo=${data.to.join(',')}`);
    }
  }

  metadataParts.push(...extraMetadata);

  return metadataParts.join('; ');
}

function hasRecordedLifecycleEvent(
  errorMessage: string | null | undefined,
  messageId: string,
  eventType: EmailWebhookEvent['type']
): boolean {
  if (!errorMessage) {
    return false;
  }

  return errorMessage
    .split('\n')
    .some((line) => line.includes(`messageId=${messageId}`) && line.includes(`event=${eventType}`));
}

async function maybeForwardInboundEmail(
  resend: Resend,
  event: EmailWebhookEvent
): Promise<InboundForwardResult> {
  if (event.type !== 'email.received') {
    return {
      attempted: false,
      configured: false,
      forwarded: false,
      metadata: [],
      toRecipients: [],
      fromAddress: null,
      forwardProviderId: null,
      error: null,
    };
  }

  if (INBOUND_FORWARD_RECIPIENTS.length === 0) {
    return {
      attempted: false,
      configured: false,
      forwarded: false,
      metadata: ['forwardConfigured=false'],
      toRecipients: [],
      fromAddress: null,
      forwardProviderId: null,
      error: null,
    };
  }

  const eventData = event.data as { email_id?: string };
  const emailId = eventData.email_id;
  if (!emailId) {
    return {
      attempted: true,
      configured: true,
      forwarded: false,
      metadata: ['forwardConfigured=true', 'forwardStatus=failed', 'forwardError=missing inbound email_id'],
      toRecipients: INBOUND_FORWARD_RECIPIENTS,
      fromAddress: INBOUND_FORWARD_FROM,
      forwardProviderId: null,
      error: 'missing inbound email_id',
    };
  }

  const to = INBOUND_FORWARD_RECIPIENTS.length === 1 ? INBOUND_FORWARD_RECIPIENTS[0] : INBOUND_FORWARD_RECIPIENTS;
  const result = await resend.emails.receiving.forward({
    emailId,
    to,
    from: INBOUND_FORWARD_FROM,
  });

  if (result.error) {
    return {
      attempted: true,
      configured: true,
      forwarded: false,
      metadata: [
        'forwardConfigured=true',
        'forwardStatus=failed',
        `forwardTo=${INBOUND_FORWARD_RECIPIENTS.join(',')}`,
        `forwardFrom=${INBOUND_FORWARD_FROM}`,
        `forwardError=${sanitizeMetadataValue(result.error.message)}`,
      ],
      toRecipients: INBOUND_FORWARD_RECIPIENTS,
      fromAddress: INBOUND_FORWARD_FROM,
      forwardProviderId: null,
      error: result.error.message,
    };
  }

  return {
    attempted: true,
    configured: true,
    forwarded: true,
    metadata: [
      'forwardConfigured=true',
      'forwardStatus=ok',
      `forwardTo=${INBOUND_FORWARD_RECIPIENTS.join(',')}`,
      `forwardFrom=${INBOUND_FORWARD_FROM}`,
      ...(result.data?.id ? [`forwardId=${result.data.id}`] : []),
    ],
    toRecipients: INBOUND_FORWARD_RECIPIENTS,
    fromAddress: INBOUND_FORWARD_FROM,
    forwardProviderId: result.data?.id || null,
    error: null,
  };
}

async function persistInboundEmail(
  resend: Resend,
  event: EmailWebhookEvent,
  forwardResult: InboundForwardResult
): Promise<string[]> {
  if (event.type !== 'email.received') {
    return [];
  }

  const eventData = event.data as { email_id?: string };
  const providerEmailId = eventData.email_id;
  if (!providerEmailId) {
    return ['inboundStored=false', 'inboundStoreError=missing provider email_id'];
  }

  const receivingResponse = await resend.emails.receiving.get(providerEmailId);
  if (receivingResponse.error || !receivingResponse.data) {
    throw new Error(
      `Failed to fetch inbound email content: ${receivingResponse.error?.message || 'missing response data'}`
    );
  }

  const inboundEmail = receivingResponse.data as ResendInboundEmail;
  const sender = parseSenderAddress(inboundEmail.from);

  const toRecipients = splitRecipients(inboundEmail.to);
  const ccRecipients = splitRecipients(inboundEmail.cc);
  const bccRecipients = splitRecipients(inboundEmail.bcc);
  const replyToRecipients = splitRecipients(inboundEmail.reply_to);

  const inReplyTo = findHeaderValue(inboundEmail.headers, 'in-reply-to');
  const references = findHeaderValue(inboundEmail.headers, 'references');
  const threadId = inReplyTo || references || inboundEmail.message_id || null;

  const attachments = (inboundEmail.attachments || []).map((attachment) => ({
    providerAttachmentId: attachment.id,
    filename: attachment.filename,
    size: attachment.size,
    contentType: attachment.content_type,
    contentId: attachment.content_id,
    contentDisposition: attachment.content_disposition,
  }));

  const commonData = {
    providerMessageId: inboundEmail.message_id,
    fromRaw: inboundEmail.from,
    fromEmail: sender.fromEmail,
    fromName: sender.fromName,
    toCsv: joinRecipients(toRecipients),
    toJson: toRecipients,
    ccCsv: ccRecipients.length > 0 ? joinRecipients(ccRecipients) : null,
    ccJson: ccRecipients.length > 0 ? ccRecipients : null,
    bccCsv: bccRecipients.length > 0 ? joinRecipients(bccRecipients) : null,
    bccJson: bccRecipients.length > 0 ? bccRecipients : null,
    replyToCsv: replyToRecipients.length > 0 ? joinRecipients(replyToRecipients) : null,
    replyToJson: replyToRecipients.length > 0 ? replyToRecipients : null,
    subject: inboundEmail.subject,
    textBody: inboundEmail.text,
    htmlBody: inboundEmail.html,
    headers: inboundEmail.headers,
    threadId,
    inReplyTo,
    references,
    rawDownloadUrl: inboundEmail.raw?.download_url || null,
    rawExpiresAt: inboundEmail.raw?.expires_at ? parseEventDate(inboundEmail.raw.expires_at) : null,
    forwardConfigured: forwardResult.configured,
    forwardStatus: forwardResult.configured ? (forwardResult.forwarded ? 'ok' : 'failed') : 'not_configured',
    forwardedToCsv: forwardResult.toRecipients.length > 0 ? joinRecipients(forwardResult.toRecipients) : null,
    forwardedToJson: forwardResult.toRecipients.length > 0 ? forwardResult.toRecipients : null,
    forwardedFrom: forwardResult.fromAddress,
    forwardProviderId: forwardResult.forwardProviderId,
    forwardError: forwardResult.error,
    receivedAt: parseEventDate(inboundEmail.created_at),
  };

  const upserted = await prisma.inboundEmail.upsert({
    where: {
      providerEmailId,
    },
    create: {
      providerEmailId,
      ...commonData,
      ...(attachments.length > 0 ? { attachments: { create: attachments } } : {}),
    },
    update: {
      ...commonData,
      attachments: {
        deleteMany: {},
        ...(attachments.length > 0 ? { create: attachments } : {}),
      },
    },
    select: {
      id: true,
    },
  });

  return [
    'inboundStored=true',
    `inboundEmailId=${upserted.id}`,
    `inboundAttachmentCount=${attachments.length}`,
  ];
}

/**
 * POST /api/webhooks/resend
 * Receives signed Resend webhook events and persists delivery lifecycle updates.
 */
export async function POST(request: NextRequest) {
  let resend: Resend;
  try {
    resend = getResendClient();
  } catch (error) {
    console.error('[ResendWebhook] Missing API key:', error);
    return apiError('Resend API key is not configured', 500, 'WEBHOOK_CONFIG_ERROR');
  }

  const webhookSecret = env.RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return apiError('Resend webhook secret is not configured', 500, 'WEBHOOK_CONFIG_ERROR');
  }

  const { id, timestamp, signature } = getWebhookHeaders(request);
  if (!id || !timestamp || !signature) {
    return apiError('Missing webhook signature headers', 400, 'INVALID_WEBHOOK_HEADERS');
  }

  const payload = await request.text();
  if (!payload) {
    return apiError('Missing webhook payload', 400, 'INVALID_WEBHOOK_PAYLOAD');
  }

  let event: WebhookEventPayload;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id,
        timestamp,
        signature,
      },
      webhookSecret,
    });
  } catch (error) {
    console.error('[ResendWebhook] Signature verification failed:', error);
    return apiError('Invalid webhook signature', 401, 'INVALID_WEBHOOK_SIGNATURE');
  }

  if (!isEmailEvent(event)) {
    return apiResponse({ received: true, ignored: true, eventType: event.type });
  }

  const eventData = event.data as { email_id?: string; to?: string[]; subject?: string };
  const messageId = eventData.email_id;
  if (!messageId) {
    return apiError('Email event missing message id', 400, 'INVALID_EMAIL_EVENT');
  }

  const duplicateWebhook = await prisma.emailLog.findFirst({
    where: {
      errorMessage: {
        contains: `webhookId=${id}`,
      },
    },
    select: { id: true },
  });

  if (duplicateWebhook) {
    return apiResponse({ received: true, duplicate: true });
  }

  const status = mapEventStatus(event.type);
  const inboundForward = await maybeForwardInboundEmail(resend, event);
  if (inboundForward.attempted && !inboundForward.forwarded) {
    console.error('[ResendWebhook] Inbound forward failed', {
      messageId,
      metadata: inboundForward.metadata,
    });
  }
  const inboundPersistenceMetadata = await persistInboundEmail(resend, event, inboundForward);
  const metadataLine = getEventMetadataLine(event, id, [...inboundForward.metadata, ...inboundPersistenceMetadata]);

  const existingLog = await prisma.emailLog.findFirst({
    where: {
      errorMessage: {
        contains: `messageId=${messageId}`,
      },
    },
    orderBy: {
      sentAt: 'desc',
    },
  });

  if (existingLog) {
    if (hasRecordedLifecycleEvent(existingLog.errorMessage, messageId, event.type)) {
      return apiResponse({ received: true, duplicate: true, duplicateReason: 'event_already_recorded', status });
    }

    const mergedMetadata = existingLog.errorMessage
      ? `${existingLog.errorMessage}\n${metadataLine}`
      : metadataLine;

    await prisma.emailLog.update({
      where: { id: existingLog.id },
      data: {
        status,
        errorMessage: mergedMetadata,
      },
    });

    return apiResponse({ received: true, updated: true, status });
  }

  const recipient = eventData.to?.[0] || 'unknown';
  const subject = eventData.subject || `Resend webhook event: ${event.type}`;

  await prisma.emailLog.create({
    data: {
      to: recipient,
      subject,
      status,
      sentAt: parseEventDate(event.created_at),
      errorMessage: metadataLine,
    },
  });

  return apiResponse({ received: true, created: true, status });
}
