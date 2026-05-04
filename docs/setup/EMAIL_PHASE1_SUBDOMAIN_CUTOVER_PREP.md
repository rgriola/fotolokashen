# Email Phase 1 Subdomain Cutover Preparation

> Last Updated: 2026-05-03 22:25:33 EDT
> Scope: Step 1 execution record, production cutover status, and remaining validation tasks
> Full recreation runbook: `docs/setup/EMAIL_SYSTEM_RECREATION_PLAN.md`

## Execution Record (What Was Done)

1. Pulled production environment and authenticated Resend API.
2. Confirmed `mail.fotolokashen.com` is now present and fully verified in Resend.
3. Verified subdomain capabilities: `sending=enabled`, records verified.
4. Updated production sender env value:
   - `EMAIL_FROM_ADDRESS=noreply@mail.fotolokashen.com`
5. Added production reply-to env value:
   - `EMAIL_REPLY_TO=support@fotolokashen.com`
6. Deployed production to apply env changes.
7. Ran post-cutover smoke send from subdomain sender:
   - API response `200`
   - Message ID: `5b36e8dd-458e-47e1-9313-f568d0306e6f`

## Current Status

1. Subdomain sender cutover is active in production.
2. Root-domain rollback remains available if issues are detected.
3. Remaining work is deliverability validation across target mailbox providers.

## Historical Blocker (Resolved)

1. Earlier attempt failed with plan/domain limit constraints.
2. Blocker is resolved after domain provisioning and verification.

## Remaining Tasks

1. Run deliverability matrix tests:
   - Gmail ✅
   - Outlook
   - Corporate mailbox target (deferred)
2. Confirm webhook lifecycle for test sends (`email.sent`, `email.delivered`).
3. Track confirmation-email outcomes for corporate recipients over next validation window (deferred).

## Current Validation Update

1. Gmail path is confirmed working for transactional flow.
2. Corporate mailbox validation is deferred temporarily while remaining email hardening work continues.
3. Outlook is the next non-corporate deliverability target before revisiting corporate mailbox rules.

## Controlled Pass Results (Completed)

1. Sent verification-style controlled message from `noreply@mail.fotolokashen.com`.
   - Message ID: `0a2989fa-8514-4688-96fc-87c5b60d8b46`
   - Provider lifecycle: `delivered`
2. Sent password-reset-style controlled message from `noreply@mail.fotolokashen.com`.
   - Message ID: `e314a2c1-b5c7-4bda-94eb-5732fafedb05`
   - Provider lifecycle: `delivered`
3. Confirmed app webhook traffic during controlled pass window (`POST /api/webhooks/resend`).
4. Confirmed persisted lifecycle metadata in `EmailLog` includes `event=email.sent` and `event=email.delivered` for both controlled-pass message IDs.

## Post-Cutover Validation Gates

1. Gate A: Verification email delivered to at least 1 corporate mailbox test account.
2. Gate B: Password reset email delivered to same corporate mailbox class.
3. Gate C: No regression in inbound support capture and forward status tracking.

## Rollback Plan

1. Revert `EMAIL_FROM_ADDRESS` to verified root-domain sender.
2. Redeploy immediately.
3. Keep subdomain records in place and continue troubleshooting without production outage.
