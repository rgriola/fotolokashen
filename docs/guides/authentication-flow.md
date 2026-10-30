# Authentication & Registration Flow

> Cross-platform authentication reference for Fotolokashen — web and iOS.  
> **Last Updated:** October 30, 2026, 13:52 EDT — durable account/media deletion implemented and tested locally; deployment and disposable staging verification pending.

---

## Overview

| Platform | Auth Mechanism | Registration UI | Session Storage |
|---|---|---|---|
| **Web** | Cookie-based JWT | Native web form | `auth_token` cookie |
| **iOS** | OAuth 2.0 PKCE | `ASWebAuthenticationSession` (Safari panel) | iOS Keychain |

Both platforms share the **same API**, the **same registration page**, and the **same email verification system**. The difference is the `platform=ios` parameter which controls post-verification redirect behavior.

### iOS OAuth state passthrough

The login form preserves optional `state` from the incoming login URL in the
authorization POST. The authorization endpoint echoes it, and the login form
forwards that returned value to `/app/auth-callback`. Both the automatic redirect
and manual open-app button preserve it in the custom-scheme callback. Query
values are URL-encoded; absent state stays absent for older iOS clients.

The stricter iOS build requires one nonempty state matching its current login.
The October 29 production verification error was reported from an Xcode-installed
strict build still labeled 1.6.2, not the older App Store installation. Local web
source was missing state forwarding in the login form and callback page; this
does not establish which commit production is running.

After deploying this fix, verify login, logout, and login again on the strict
build against production, plus login on the older App Store client. Do not remove
iOS state validation to accommodate a callback missing state.

---

## Web Registration Flow

### Auto-login token enforcement

Email verification for iOS generates a 32-byte random token, stores its hash and
sets a five-minute expiry. The auto-login exchange rejects null or expired
expiry, and conditionally consumes the matching, unexpired token before issuing
credentials. Only one concurrent request can win; replay cannot issue another
credential set. Expired-token cleanup matches the original hash and expiry so
it cannot clear a newer token. Failure after consumption intentionally leaves
the one-time token unusable; the user can log in manually.

Five focused regression tests cover concurrent use, null/past/current expiry,
and unsuccessful atomic consumption. All 41 selected auth/API contract tests
pass locally. The auto-login change still requires deployment.

```
User → /register → fills form → POST /api/auth/register
  → User created (emailVerified: false)
  → Verification email sent
  → "Check Your Email" card shown in browser
  → User opens email → clicks /verify-email?token=xxx
  → Email verified → "Go to Login" button → /login
  → User logs in → cookie set → authenticated
```

### Key Files (Web)

| File | Role |
|------|------|
| `src/app/register/page.tsx` | Register page layout, logo hiding on mobile |
| `src/components/auth/RegisterForm.tsx` | Form + success state ("Check Your Email" card) |
| `src/app/api/auth/register/route.ts` | Creates user, sends verification email |
| `src/lib/email.ts` → `sendVerificationEmail()` | Builds verification URL, sends via Resend |
| `src/app/verify-email/page.tsx` | Verifies token, shows success/error UI |
| `src/app/api/auth/verify-email/route.ts` | Verifies hashed token, generates autoLoginToken for iOS |

---

## iOS Registration Flow

The iOS app opens the web registration form inside `ASWebAuthenticationSession` — a system-managed Safari panel. The panel cannot read cookies or JavaScript state from the iOS app, so the post-registration UX relies entirely on **deep link redirects**.

```
┌─────────────────────────────────────────────────┐
│ iOS App                                         │
│                                                 │
│  1. Taps "Create Account"                       │
│  2. AuthService.startRegistration()             │
│  3. ASWebAuthenticationSession opens:           │
│     fotolokashen.com/register                   │
│  4. User fills web form → submits               │
│  5. "Check Your Email" card shown in panel      │
│  6. User closes panel, opens email              │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ Backend (POST /api/auth/register)               │
│                                                 │
│  • Detects iOS via User-Agent (iPhone/iPad)     │
│  • Sets deviceType = 'mobile-browser-ios'       │
│  • Passes platform='ios' to sendVerification()  │
│  • Verification URL:                            │
│    /verify-email?token=xxx&platform=ios         │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ Email → User taps link → opens in Safari        │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ Web: /verify-email?token=xxx&platform=ios       │
│                                                 │
│  • GET /api/auth/verify-email?token=xxx         │
│  • Email verified                               │
│  • API generates one-time autoLoginToken        │
│  • autoLoginToken stored as SHA-256 hash in DB  │
│  • Raw autoLoginToken passed to web page        │
│  • Page auto-redirects to deep link:            │
│    fotolokashen://email-verified?token=xxx      │
│  • Fallback: "Open Fotolokashen" button shown   │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ iOS App (Deep Link)                             │
│                                                 │
│  • fotolokashen://email-verified?token=xxx      │
│  • DeepLinkManager.handleURL() received         │
│  • AuthService calls POST /api/auth/auto-login  │
│    with { token, client_id, device_name }       │
│  • Server hashes incoming token, finds user     │
│  • Returns access_token + refresh_token         │
│  • Tokens saved to Keychain → authenticated     │
│  • Safari panel dismissed automatically         │
└─────────────────────────────────────────────────┘
```

### Key Files (iOS)

| File | Role |
|------|------|
| `AuthService.swift` | `startRegistration()`, `startLogin()`, `handleAutoLogin()` |
| `DeepLinkManager.swift` | Routes `fotolokashen://` URLs, `emailVerified` flag |
| `ContentView.swift` / `LoginView` | Observes `emailVerified`, auto-triggers startLogin() |
| `Info.plist` | Registers `fotolokashen` custom URL scheme |

---

## iOS Login Flow

```
LoginView → AuthService.startLogin()
  → ASWebAuthenticationSession opens fotolokashen.com/login
  → User logs in → OAuth redirect:
    fotolokashen://oauth-callback?code=xxx
  → AuthService.handleCallback()
  → POST /api/auth/oauth/token (code exchange)
  → access_token + refresh_token → Keychain
  → isAuthenticated = true
```

---

## ⚠️ Known UX Gap — "Email Already Exists" on iOS

### Current Broken Behavior

When an iOS user opens the registration panel and submits with an email that **already has an account**:

1. `POST /api/auth/register` returns `409 EMAIL_EXISTS`
2. `RegisterForm` calls `toast.error("Email already registered")`
3. The **toast is not visible** in `ASWebAuthenticationSession` (no toast container in the panel)
4. The form displays a small inline error (browser toast fallback)
5. **The Safari panel stays open** — user is stuck with no clear action

### Expected Behavior

The panel should close and the iOS app should receive a deep link that triggers the login flow, with a message explaining the situation.

### Fix Required

**Two-part fix:**

#### Part 1 — `RegisterForm.tsx` (Web)
Detect `EMAIL_EXISTS` error code specifically. Read `?client_id=` and `?redirect_uri=` URL params (passed by `AuthService.startRegistration()`). When `EMAIL_EXISTS` is returned AND the page was opened from iOS:

```
→ Show brief in-panel message: "You already have an account. Redirecting to login..."
→ After 2 seconds redirect: fotolokashen://register-redirect?action=login&reason=account_exists
```

#### Part 2 — iOS `DeepLinkManager.swift`
Handle the new `register-redirect` scheme:
```swift
// fotolokashen://register-redirect?action=login&reason=account_exists
// → Dismiss panel → show "You already have an account. Please log in." alert
// → Auto-call AuthService.startLogin()
```

#### Implementation Notes
- The registration page URL should include `?source=ios` or `?client_id=xxx` so `RegisterForm` knows it was opened by the app
- `AuthService.startRegistration()` already builds a URL — add `&source=ios` to it
- `RegisterForm` reads `useSearchParams()` to detect iOS context
- Only fire the redirect for `EMAIL_EXISTS` — other errors stay inline (wrong password format, username taken, etc.)

**Status: ❌ Not implemented — this is a known open issue.**

---

## Account Deletion and Durable Media Cleanup

Updated October 30, 2026, 13:52 EDT.

`DELETE /api/auth/delete-account` accepts only the authenticated user's ID.
Both self-deletion and `DELETE /api/admin/users/[id]` use
`src/lib/account-deletion.ts`. A serializable database transaction:

1. Snapshots avatar/banner file IDs and photos deleted by either the uploader
   or location-creator cascade, including legacy file paths.
2. Creates an independent `account_media_cleanup` row with storage identifiers,
   purge targets, timestamps and retry/lease state.
3. Hard-deletes the user, cascading sessions, OAuth codes/refresh tokens and
   related records.
4. Records the committed deletion without copying the deleted user's name,
   email or username into the audit metadata.

If any step fails, the transaction rolls back both the deletion and cleanup
enqueue. The queue intentionally has no user foreign key. Self-deletion keeps
the existing HTTP 200 `{ success: true, message: string }` contract and adds
`mediaCleanup: "queued"`; it does not claim that CDN removal is already complete.
Web and native confirmation copy explain background media removal.

Next.js `after()` attempts cleanup after responding. The authenticated
`GET /api/cron/account-media-cleanup` worker resumes committed jobs if that work
fails or is interrupted. Only `Authorization: Bearer <CRON_SECRET>` is accepted;
missing configuration fails closed. The worker returns aggregate counts, HTTP
503 for failed cleanup attempts and HTTP 500 for infrastructure failures.

### Storage and cache guarantees

- Each claim has a five-minute lease and unique ownership token. A terminated
  worker becomes retryable; a stale worker cannot overwrite its successor's
  checkpoints. Each successful file removal is checkpointed.
- An attempt removes at most 25 files, submits at most ten invalidations and
  checks at most ten purge statuses. A scheduled invocation selects five due
  jobs. Errors retain work and schedule an eligible retry one hour later.
- Only an SDK-confirmed HTTP 404 is treated as an already-deleted file/folder.
  Authorization, quota and server failures are not treated as success.
- Folder removal runs even if the account never uploaded a tracked photo.
  A final sweep runs no earlier than two hours after enqueue to catch uploads
  authorized before deletion; the installed SDK currently defaults to
  30-minute upload signatures. Reassess this delay if upload authorization or
  in-flight upload duration changes.
- **Deleting storage does not invalidate CDN caches.** The queue separately
  submits wildcard invalidations for the user-folder URL and legacy media URLs,
  covering the application's query-string transformation URLs. It reissues
  invalidations after the final sweep and retains the job until ImageKit
  reports every request `Completed`, not merely accepted.
- This is not a promise to recall browser/downloaded copies, external image
  hosts, unrelated CDN layers, or arbitrary historical path-prefixed
  transformations. Verify actual served URL variants in staging; any additional
  delivery host/pattern needs explicit purge coverage before claiming full CDN
  erasure.

ImageKit's documented [cache invalidation rules](https://imagekit.io/docs/cdn-caching-and-purging)
allow these trailing wildcards for nested folders and complete file paths.
Purge requests consume the account's plan allowance and can incur charges.
No live ImageKit deletion or purge was performed during local validation.

### Deployment and remaining verification

1. Apply `20261030134500_account_media_cleanup` to the intended **staging**
   database before deploying this backend. Use the existing migration workflow;
   never use `db push --accept-data-loss` against production.
2. Configure `CRON_SECRET` in each worker environment. The committed Vercel
   schedule is **daily at 13:00 UTC**, consistent with the existing daily cron.
   The one-minute purge poll / one-hour retry timestamps are eligibility times,
   not a scheduler: completion can take multiple daily invocations. For a
   tighter deletion SLA or higher volume, explicitly configure more frequent
   authenticated scheduling supported by the deployment plan. Vercel scheduled
   crons run on production deployments; preview/staging needs a separately
   configured authenticated scheduler or controlled manual invocations.
3. Monitor worker response/log counters and queue age, attempts and `last_error`;
   investigate persistent failures/backlog. Do not remove pending rows to make
   monitoring appear successful. Completed jobs are deleted automatically.
4. With a **disposable staging account**, upload photos, avatar and banner; retain
   their original and transformed URLs. Delete the account, then verify the
   user/related rows and all web/mobile sessions/OAuth credentials are gone.
5. Confirm the cleanup row survives simulated storage/quota failure, resumes
   after service recovery and disappears only after the final sweep and
   confirmed cache invalidation. Verify media URLs no longer serve originals
   or transformed copies. Include avatar/banner-only and no-media accounts.
6. Only after staging evidence, deploy the migration/configuration/backend to
   production and verify worker scheduling/health without deleting real accounts.

Local validation: 110 selected regression tests passed, including 18 against a
disposable loopback PostgreSQL database with real migrations, cascade deletion,
atomic rollback, worker ownership/recovery, durable checkpoints and mocked
ImageKit failure/purge completion. TypeScript and focused ESLint passed.

To run the database tests, create a disposable local database named
`fotolokashen_account_deletion_test`, set `ACCOUNT_DELETION_TEST_DATABASE_URL`
to its `127.0.0.1` PostgreSQL URL, then:

```bash
DATABASE_URL="$ACCOUNT_DELETION_TEST_DATABASE_URL" npx prisma migrate deploy
npx prisma generate
npm test -- src/lib/__tests__/accountDeletion.integration.test.ts
```

The test suite refuses other hosts/database names and deletes fixtures in that
database. Without the explicit test URL, these integration tests are reported
as skipped; the normal unit tests do not connect to a real database.

---

## Token Security (Post-April 2026 Hardening)

All sensitive tokens are now stored as **SHA-256 hashes** in the database. Raw tokens are only ever sent to the user (via email or deep link).

| Token | Where Generated | Stored In DB | Lookup Method |
|---|---|---|---|
| `verificationToken` | `crypto.randomBytes(32)` | `SHA-256(token)` | `hashToken(incoming)` |
| `resetToken` | `crypto.randomBytes(32)` | `SHA-256(token)` | `hashToken(incoming)` |
| `autoLoginToken` | `crypto.randomBytes(32)` | `SHA-256(token)` | `hashToken(incoming)` |

`hashToken()` is exported from `src/lib/auth.ts`:
```typescript
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}
```

Token flow:
1. **Generate** raw token with `crypto.randomBytes(32).toString('hex')`
2. **Send** raw token in email/deep link URL
3. **Store** `hashToken(rawToken)` in the database
4. **Verify**: on receipt, `hashToken(incomingToken)` → DB lookup

---

## Platform Detection

The backend detects the platform from the `User-Agent` header during registration:

```typescript
// src/app/api/auth/register/route.ts
const ua = userAgent.toLowerCase();
let deviceType = 'web';
if (ua.includes('iphone') || ua.includes('ipad')) {
  deviceType = 'mobile-browser-ios';
} else if (ua.includes('android')) {
  deviceType = 'mobile-browser-android';
} else if (ua.includes('mobile')) {
  deviceType = 'mobile-browser';
}

const platform = deviceType === 'mobile-browser-ios' ? 'ios' : undefined;
await sendVerificationEmail(email, verificationToken, username, platform);
```

The `platform` parameter appends `&platform=ios` to the verification URL, which the `verify-email` page uses to trigger the iOS deep link instead of the web login redirect.

> **Note:** User-Agent detection is fragile. Longer-term, passing `?source=ios` as a URL param on the registration page (set by `AuthService.startRegistration()`) is more reliable.

---

## Deep Link Scheme

| URL | Handler | Purpose |
|-----|---------|---------| 
| `fotolokashen://oauth-callback?code=xxx` | `AuthService.handleCallback()` | OAuth code exchange after login |
| `fotolokashen://email-verified?token=xxx` | `DeepLinkManager` → auto-login | Return to app + auto-login after email verify |
| `fotolokashen://register-redirect?action=login&reason=account_exists` | `DeepLinkManager` → login | ⚠️ **Not yet implemented** — needed for "email exists" UX fix |
| `fotolokashen://location/{id}` | `DeepLinkManager.navigateToLocation()` | Open a specific location |

---

## Rate Limiting

| Endpoint | Limit | Window | Implementation |
|---|---|---|---|
| `POST /api/auth/login` | ~10 attempts | 15 min | `RateLimitPresets.LOGIN` |
| `POST /api/auth/register` | ~5 attempts | 15 min | `RateLimitPresets.STRICT` |
| `POST /api/auth/forgot-password` | 2 requests | 15 min | DB-backed (`getPasswordResetRequestCount`) |
| `PATCH /api/v1/users/me` | 100 requests | 15 min | `RateLimitPresets.LENIENT` |
| `POST /api/locations` | 100 requests | 15 min | `RateLimitPresets.LENIENT` |

> **⚠️ Known Limitation:** All rate limiting uses an **in-memory `Map`** that resets on every Vercel serverless cold start. This makes brute-force protection non-functional in production. Migration to Upstash Redis or Vercel KV is a known pending item.

---

## Username Handling

- **Live enforcement**: The `RegisterForm` username input forces lowercase and strips trailing whitespace via `onChange`
- **Schema backup**: Zod schema applies `.toLowerCase().trim()` on submit
- **Regex**: Only `[a-zA-Z0-9_-]` allowed (min 3, max 50)

---

## Date of Birth

- **Component**: `DateOfBirthPicker.tsx` with three scroll-wheel pickers (Month / Day / Year)
- **Default**: Intentionally blank — never pre-selects today's date
- **Year range**: 18–100 years ago (enforces minimum age at UI level)
- **Output**: ISO `YYYY-MM-DD` string
- **Validation**: Zod schema double-checks age ≥ 18 server-side

---

## Mobile Auth UI

On mobile viewports (< 640px):

- **Header**: Hidden on all auth routes via `hidden sm:block`
- **Logo**: Hidden above the auth card via `hidden sm:flex`
- **Spacing**: Compact — `space-y-3`, `h-9` inputs, `text-xs` labels
- **Card**: Full-width, vertically centered

This prevents the header from overlapping the form in `ASWebAuthenticationSession` and reduces scrolling on small panels.
