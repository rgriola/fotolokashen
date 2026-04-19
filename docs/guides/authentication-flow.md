# Authentication & Registration Flow

> Cross-platform authentication reference for Fotolokashen — web and iOS.  
> **Last Updated:** April 2026 — reflects SHA-256 token hashing, auto-login flow, and iOS UX gaps.

---

## Overview

| Platform | Auth Mechanism | Registration UI | Session Storage |
|---|---|---|---|
| **Web** | Cookie-based JWT | Native web form | `auth_token` cookie |
| **iOS** | OAuth 2.0 PKCE | `ASWebAuthenticationSession` (Safari panel) | iOS Keychain |

Both platforms share the **same API**, the **same registration page**, and the **same email verification system**. The difference is the `platform=ios` parameter which controls post-verification redirect behavior.

---

## Web Registration Flow

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
