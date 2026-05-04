# Email System Recreation Plan

> Last Updated: 2026-05-03 23:17:30 EDT
> Goal: Recreate the current production-grade email system end-to-end after a fresh setup, migration, or disaster recovery event.

## Target State

This runbook recreates the current setup that is live in the app:

1. Transactional outbound email via Resend.
2. Safe email verification flow (GET validate, POST confirm).
3. Signed Resend webhook ingestion for lifecycle + inbound events.
4. Inbound email persistence in database (including attachments metadata).
5. Inbound forward attempt tracking (`ok`, `failed`, `not_configured`).
6. Admin inbox visibility and health metrics.
7. Manual and cron-triggered Slack alerts for forwarding failures.
8. Subdomain sender strategy (`mail.fotolokashen.com`) for deliverability.

## Source of Truth (Code Paths)

1. Environment validation: `src/lib/env.ts`
2. Verification flow: `src/app/api/auth/verify-email/route.ts`, `src/app/verify-email/page.tsx`
3. Resend webhook: `src/app/api/webhooks/resend/route.ts`
4. Admin inbox health: `src/app/api/admin/inbound-emails/health/route.ts`
5. Manual alert endpoint: `src/app/api/admin/inbound-emails/health/alert/route.ts`
6. Cron alert endpoint: `src/app/api/cron/inbound-email-forward-alert/route.ts`
7. Shared alert logic: `src/lib/inbound-email-alerts.ts`
8. Schedule config: `vercel.json`

## Phase 0 - Prerequisites

1. Access to Vercel project, Resend project, DNS provider for `fotolokashen.com`, and production database.
2. Access to deploy branch (`main`) and ability to run production deploy.
3. A Slack incoming webhook URL for alert delivery (optional at bootstrap, required for full completion).
4. Confirm required sender domain exists and is verified in Resend:
   - Recommended sender: `noreply@mail.fotolokashen.com`

## Phase 1 - Database and App Baseline

1. Pull latest code from `main`.
2. Install dependencies:

```bash
npm install
```

3. Ensure schema is applied and Prisma client is generated:

```bash
npm run db:push
npm run db:generate
```

4. Run production-like local build check before deploy:

```bash
npm run build:production
```

## Phase 2 - Resend Setup

1. In Resend, verify `mail.fotolokashen.com` domain and DNS records (SPF, DKIM, verification TXT).
2. Configure webhook endpoint to:
   - `https://fotolokashen.com/api/webhooks/resend`
3. Configure webhook secret and store it as `RESEND_WEBHOOK_SECRET` in Vercel.
4. Ensure webhook event coverage includes transactional lifecycle events and inbound receive events.

## Phase 3 - Vercel Environment Variables

Configure these in Production first, then Preview as needed for validation parity.

### Required for Production Send Path

```bash
EMAIL_SERVICE=resend
EMAIL_MODE=production
EMAIL_API_KEY=<resend_api_key>
EMAIL_FROM_NAME=Fotolokashen
EMAIL_FROM_ADDRESS=noreply@mail.fotolokashen.com
EMAIL_REPLY_TO=support@fotolokashen.com
NEXT_PUBLIC_APP_URL=https://fotolokashen.com
```

### Required for Webhook + Inbound Forward Tracking

```bash
RESEND_WEBHOOK_SECRET=<resend_webhook_secret>
RESEND_INBOUND_FORWARD_FROM=noreply@mail.fotolokashen.com
RESEND_INBOUND_FORWARD_TO=<comma_separated_recipients>
```

### Required for Cron Alert Auth

```bash
CRON_SECRET=<strong_random_token>
```

Notes:

1. `INBOUND_ALERT_CRON_TOKEN` is supported as fallback, but `CRON_SECRET` is preferred.
2. Cron and admin alert endpoint both accept bearer auth using this secret path.

### Required for Slack Alert Delivery (Full Completion)

```bash
SLACK_WEBHOOK_URL=<slack_incoming_webhook_url>
```

## Phase 4 - Deploy

1. Deploy to production after env updates.
2. Confirm build success in Vercel (build command comes from `vercel.json`: `npm run build:production`).
3. Confirm cron route is present in deployment:
   - Path: `/api/cron/inbound-email-forward-alert`
   - Schedule: `0 12 * * *` (daily, UTC)

## Phase 5 - Functional Validation Checklist

### A) Transactional Outbound

1. Trigger password reset and email verification flows.
2. Verify messages are accepted and delivered in Resend logs.
3. Verify sender identity is `noreply@mail.fotolokashen.com`.

### B) Verification Safety (Scanner-Proof)

1. Open verify link page and confirm validation request does not verify account.
2. Confirm user is verified only after explicit POST confirmation action.
3. Confirm token is cleared after successful verification.

### C) Inbound Capture + Persistence

1. Send a message to support receiving address.
2. Confirm record appears in Admin Inbox list.
3. Confirm detail view includes headers/body and attachment metadata when present.

### D) Forward Status Tracking

1. Confirm inbound message stores forward status (`ok`, `failed`, or `not_configured`).
2. Confirm failed forwarding captures `forwardError` text for debugging.

### E) Webhook Idempotency Guard

1. Validate duplicate lifecycle webhooks do not append duplicate lifecycle lines for same message/event pair.
2. Confirm webhook endpoint returns success for valid signed payloads.

### F) Health + Alerts

1. Open admin inbox page and confirm health card loads 24h metrics.
2. Test manual alert endpoint from admin UI (or API).
3. Test cron endpoint authorization:

```bash
curl -i "https://fotolokashen.com/api/cron/inbound-email-forward-alert"
```

Expected: `401` without token.

4. Test authorized cron trigger:

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
  "https://fotolokashen.com/api/cron/inbound-email-forward-alert?force=true"
```

Expected:

1. `200` response.
2. If `SLACK_WEBHOOK_URL` is set, alert message sent to Slack.
3. If not set, response indicates `ALERT_CHANNEL_NOT_CONFIGURED`.

## Phase 6 - Deliverability Matrix

Run after cutover and after any sender/domain changes.

1. Gmail mailbox test (inbox/spam placement).
2. Outlook mailbox test (inbox/spam placement).
3. Corporate mailbox test (inbox/spam placement, policy filtering behavior).
4. Record outcomes in a dated validation log doc.

## Rollback Plan

Use rollback only if major regression is detected.

1. Revert `EMAIL_FROM_ADDRESS` to last known good verified sender.
2. Keep webhook and inbound persistence enabled.
3. Redeploy immediately.
4. Re-run Phase 5 checks A, C, and F.

## Definition of Done

The recreation is complete when all are true:

1. Outbound transactional emails send and deliver from `mail.fotolokashen.com` sender.
2. Verify-email endpoint behavior is side-effect free on GET and verify-on-POST only.
3. Inbound messages persist and appear in admin inbox.
4. Forwarding status is captured with actionable errors.
5. Health endpoint reports metrics correctly.
6. Manual and cron alert paths execute successfully.
7. Slack alert channel is configured and verified.
8. Gmail and Outlook matrix entries are validated (corporate may remain deferred if explicitly documented).

## Suggested Execution Order (Fast Path)

1. Phase 1 and Phase 3.
2. Deploy (Phase 4).
3. Run validation A through F (Phase 5).
4. Run deliverability matrix (Phase 6).
5. Mark completion against Definition of Done.
