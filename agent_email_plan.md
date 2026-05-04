# Email System Agent Plan - Foundation and Next Phases

> Last Updated: 2026-05-03 20:54:21 EDT
> Status: Phase 1 in progress (monitoring slice implemented, subdomain sender cutover active, controlled pass delivered, corporate deliverability validation pending)

## Purpose

This plan tracks the email system recovery and improvement effort. The first milestone was to restore and validate inbound receiving, persistence, forwarding, and admin visibility. Next milestones focus on hardening and operations.

## Phase 0 Summary (Completed)

1. Added signed Resend webhook processing at /api/webhooks/resend.
2. Added inbound persistence models in Prisma:
   - InboundEmail
   - InboundEmailAttachment
3. Persisted full inbound message data from receiving API:
   - sender and recipient envelope fields
   - subject, text body, html body
   - headers, thread identifiers, raw metadata
   - attachment metadata
4. Implemented forwarding outcome tracking in stored records:
   - forwardConfigured
   - forwardStatus (ok, failed, not_configured)
   - forwardedToCsv, forwardedFrom, forwardError
5. Added admin inbox APIs:
   - GET /api/admin/inbound-emails (paging, search, support-only, forward status filter)
   - GET /api/admin/inbound-emails/[id] (full detail + attachments)
6. Added Admin Inbox UI and updated admin navigation.
7. Updated production environment variables and deployed.
8. Ran live inbound tests and confirmed:
   - inbound email is received and persisted
   - forwarded email path works
   - status is visible in admin detail

## Notes from Live Validation

1. A forwarding failure was correctly captured when forward-from used an unverified domain.
2. After changing forward-from to a verified sender domain and redeploying, forwarding status moved to ok.
3. Gmail to support mailbox test succeeded and appeared in Admin Inbox.

## New Deliverability Note (Corporate Mail)

1. A confirmation email sent to a corporate mailbox did not arrive in inbox or spam, while Resend showed successful processing.
2. A support email sent from that same corporate mailbox to support was received, confirming inbound receiving path works.
3. This suggests a deliverability gap specific to outbound confirmation mail path and recipient-side filtering rules.
4. Working assumption: sender/domain reputation and mailbox policy alignment may require dedicated sending subdomain segmentation.

## Step 1 Execution Status (Subdomain Activation)

1. `mail.fotolokashen.com` is now created and verified in Resend.
2. Production sender was cut over to `noreply@mail.fotolokashen.com`.
3. Production redeploy completed after env update.
4. Post-cutover smoke send from subdomain sender returned `200` (accepted by provider).
5. Controlled pass completed with two message types (verification-style and password-reset-style), both with provider `delivered` lifecycle.
6. Remaining validation: real mailbox deliverability matrix (Gmail, Outlook, corporate).

### Decision Path to Unblock

1. Blocker resolved.
2. Keep rollback path ready by preserving root-domain sender configuration.
3. Focus now shifts to deliverability validation and ops monitoring.

## Current Baseline

1. Receiving: operational in production.
2. Storage: operational in production.
3. Forwarding: operational in production with verified sender domain.
4. Admin visibility: operational, including explicit forwardConfigured, forwardStatus, and forwardError rows.

## Phase 1 - Hardening (Next)

### Phase 1 Progress

- [x] Monitoring and alerting (slice 1)
  - Added admin health endpoint for 24h inbound and forwarding metrics
  - Added Admin Inbox health card with warning/healthy status and quick filters
- [ ] Deliverability and sender-domain segmentation
  - Evaluate migration to dedicated sending subdomain (mail.fotolokashen.com)
  - Keep inbound receiving on dedicated receiving path to avoid reputation coupling
  - Validate confirmation email deliverability to corporate domains after cutover
  - Cutover complete; controlled pass delivered; validation matrix in progress
- [ ] Secrets and environment safety
- [ ] Webhook robustness
- [ ] Data quality and retention
- [ ] Monitoring and alerting (slice 2: alert channel)

1. Secrets and environment safety
   - rotate any keys that were exposed in local files or logs
   - verify strict separation for Development, Preview, and Production values
2. Webhook robustness
   - strengthen idempotency guarantees for duplicate webhook delivery
   - standardize structured logging for webhook failures
3. Data quality and retention
   - define retention policy for inbound bodies and raw metadata
   - evaluate attachment metadata retention and cleanup strategy
4. Monitoring and alerting
   - add failed-forward count for last 24h in admin health surface
   - add an alert channel for non-zero failed forwards
5. Deliverability and sender-domain segmentation
   - migrate confirmation and transactional sending to a dedicated subdomain
   - keep separate sender identities for transactional and support workflows
   - run a deliverability matrix test across Gmail, Outlook, and corporate mailbox targets

## Phase 2 - Ops (After Hardening)

1. Runbook
   - inbound failure triage checklist
   - webhook signature failure checklist
   - forwarding failure checklist
2. Operational cadence
   - daily smoke test to support mailbox
   - weekly review of failed forward entries
3. Ownership
   - define who monitors inbox
   - define response time targets for support mail

## Candidate Agent Tasks (Next Session)

1. Build a small Email Health card in Admin:
   - last inbound received time
   - failed forwards in last 24h
   - quick link to filtered failed list
2. Add a lightweight alert endpoint or scheduled check for failed forwards.
3. Write a short operations runbook under docs/operations.
4. Execute subdomain migration checklist from docs/setup/EMAIL_SUBDOMAIN_PLAN.md and capture outcomes.

## Definition of Done for Hardening + Ops

1. Failed forward detection is visible and alertable.
2. A written runbook exists and is testable.
3. Daily smoke-test procedure is documented and repeatable.
4. No secret management gaps remain across environments.
