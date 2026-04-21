# Ideal Auth System — Web + iOS

> **Purpose:** Reference architecture for a cross-platform auth system connecting a Next.js web app to an iOS app, accounting for Apple's mandatory `ASWebAuthenticationSession` (Safari panel) requirement.
>
> **Status:** ✅ Fully implemented. All flows working across web and iOS.
>
> **Last reviewed against codebase:** April 20, 2026

---

## The Core iOS Constraint

Apple's App Store Review Guideline 4.8 **mandates** `ASWebAuthenticationSession` for all OAuth and login flows. Using `WKWebView` for authentication is grounds for rejection.

**What `ASWebAuthenticationSession` is:**
- A system-managed Safari panel — not your app's browser, not `WKWebView`
- Shares cookies with Safari but is sandboxed from your app
- **Automatically closes itself** the moment it intercepts a URL matching your registered `callbackURLScheme`
- Has no bridge to your app's UI, JavaScript state, or component libraries

**Critical implementation detail:**
```swift
// AuthService.swift — version-dependent callback
if #available(iOS 17.4, *) {
    // Login: Universal Link callback (domain-verified, cannot be hijacked)
    session = ASWebAuthenticationSession(
        url: url,
        callback: .https(host: "fotolokashen.com", path: "/app/auth-callback"),
        completionHandler: completionHandler
    )
    // Non-login flows: custom scheme callback
    session = ASWebAuthenticationSession(
        url: url,
        callback: .customScheme("fotolokashen"),
        completionHandler: completionHandler
    )
} else {
    // iOS 17.0-17.3: custom scheme only
    session = ASWebAuthenticationSession(
        url: url,
        callbackURLScheme: "fotolokashen",
        completionHandler: completionHandler
    )
}
```

For **login** (OAuth), the callback is `https://fotolokashen.com/app/auth-callback?code=xxx` on iOS 17.4+ (Universal Link) or `fotolokashen://oauth-callback?code=xxx` on older versions. For **non-login flows** (registration, forgot-password), `fotolokashen://await-verification` etc. always use the custom scheme.

`handleCallback(url:)` routes by URL host and handles both HTTPS and custom scheme URLs.

---

## The One Rule

> **Every iOS auth flow must end with a deep link redirect — every time.**

The panel should never require the user to manually close it. The web page drives itself to a `fotolokashen://something` URL, which auto-closes the panel and hands control back to the native app.

---

## Deep Link Registry (Complete)

| Deep Link | Trigger | App Action |
|---|---|---|
| `fotolokashen://oauth-callback?code=xxx` | Login complete | Exchange code → tokens → authenticated |
| `fotolokashen://await-verification` | Registration submitted successfully | Close panel; show native "Check your email" UI |
| `fotolokashen://email-verified?token=xxx` | User tapped email verification link | Call `POST /api/auth/auto-login` → auto-login |
| `fotolokashen://await-password-reset` | Forgot-password form submitted | Close panel; show native "Check your email for reset link" |
| `fotolokashen://password-reset-complete` | Password successfully reset | Close panel; show "Password updated" → prompt login |
| `fotolokashen://auth-redirect?action=&reason=` | Error routing (e.g. account exists) | Close panel; handle reason with native UI |

> **Note:** The `email-verified` deep link is handled by `DeepLinkManager.handleURL()` (not the `ASWebAuthenticationSession` callback) because it arrives from regular Safari, not from the auth panel. All other deep links in this table are intercepted by the `ASWebAuthenticationSession` callback and must be routed in `AuthService`.

---

## Flow 1 — Login ✅

Standard OAuth 2.0 PKCE. This flow is already correct.

```
App
  → generates code_verifier + code_challenge (PKCEGenerator.generate())
  → selects redirect_uri based on iOS version:
      iOS 17.4+: https://fotolokashen.com/app/auth-callback  (Universal Link)
      iOS 17.0:  fotolokashen://oauth-callback                (custom scheme)
  → opens ASWebAuthenticationSession:
      fotolokashen.com/login?
        client_id=xxx
        &redirect_uri=<selected_uri>
        &code_challenge=xxx
        &code_challenge_method=S256
        &scope=read+write
        &response_type=code

User logs in on web page
  → server validates credentials
  → server issues authorization code
  → server redirects to the redirect_uri with ?code=xxx

ASWebAuthenticationSession intercepts the callback
  (via .https() on 17.4+ or callbackURLScheme on 17.0)
  → panel auto-closes
  → completion handler fires with callbackURL

AuthService.handleCallback(url:)
  → detects scheme (https → normalize to "oauth-callback", custom → use host)
  → parses ?code= from URL
  → POST /api/auth/oauth/token { code, code_verifier, client_id, redirect_uri }
  → receives access_token + refresh_token
  → OAuthToken saved to Keychain via KeychainService
  → currentUser set, isAuthenticated = true
```

### Current implementation
- `AuthService.startLogin()` — builds URL, calls `startWebAuthSession(url:)`
- `startWebAuthSession` — creates `ASWebAuthenticationSession`, registers `"fotolokashen"` as callback scheme
- `handleCallback(url:)` — parses `code`, calls `exchangeCodeForTokens(code:)`
- `exchangeCodeForTokens` — PKCE exchange, saves to Keychain
- `prefersEphemeralWebBrowserSession = false` — shares cookies with Safari (allows "remember me")

---

## Flow 2 — Create Account

Registration is a 3-stage flow. The Safari panel should only be open for **stage 1**.

### Stage 1 — Panel Open (Registration Form)

```
App
  → opens ASWebAuthenticationSession:
      fotolokashen.com/register?
        source=ios                     ← NEW: explicit platform signal
        &client_id=xxx

User fills form → submits
  → POST /api/auth/register
  → Backend: creates user (emailVerified: false)
  → Backend: sends verification email with &platform=ios
  → Backend: returns 201 success

RegisterForm.tsx detects: source=ios + success
  → instead of showing "Check Your Email" card
  → redirects immediately: fotolokashen://await-verification

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes
  → completion handler fires with fotolokashen://await-verification
  → AuthService routes this URL (no ?code= → not an OAuth callback)
  → App shows native "Check Your Email" screen
```

### Stage 2 — No Panel (Email Client)

```
User opens email on device (Mail.app, Gmail, etc.)
  → taps verification link
  → opens in regular Safari (NOT the auth panel):
      fotolokashen.com/verify-email?token=xxx&platform=ios

verify-email page
  → calls GET /api/auth/verify-email?token=xxx&platform=ios
  → Server: hashes token → finds user → sets emailVerified = true
  → Server: generates one-time autoLoginToken
  → Server: stores SHA-256(autoLoginToken) in DB
  → Server: returns { success: true, autoLoginToken: rawToken }

verify-email page detects: platform=ios + autoLoginToken in response
  → shows "Continue to fotolokashen" button (deep link)
  → button href: fotolokashen://email-verified?token=<rawAutoLoginToken>
```

> **Implementation note:** The verify-email page auto-redirects after 2 seconds for `platform=ios + success`, with a fallback "Continue to fotolokashen" button. This works for both first-time and already-verified cases.

### Stage 3 — No Panel (App Handles via DeepLinkManager)

```
User taps "Continue to fotolokashen" (or auto-redirect fires)
  → iOS opens: fotolokashen://email-verified?token=xxx
  → DeepLinkManager.handleURL() receives this
  → sets autoLoginToken = token, emailVerified = true
  → ContentView/LoginView observes emailVerified flag

AuthService.autoLoginWithToken(token)
  → POST /api/auth/auto-login {
        token: xxx,          ← raw token (server hashes to verify)
        client_id: xxx,
        device_name: "iPhone 15",
        user_agent: "fotolokashen-ios/1.0 ..."
      }
  ← { access_token, refresh_token, user }
  → OAuthToken saved to Keychain
  → Dismisses any lingering webAuthSession: webAuthSession?.cancel()
  → currentUser set, isAuthenticated = true
```

---

## Flow 3 — Email Already Exists ✅

```
User submits registration form with existing email
  → POST /api/auth/register → 409 EMAIL_EXISTS

RegisterForm.tsx detects: source=ios + EMAIL_EXISTS
  → shows inline message (not toast): "You already have an account."
  → after 1.5s: window.location.href = fotolokashen://auth-redirect?action=login&reason=account_exists

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes
  → completion handler fires with auth-redirect URL

AuthService.handleCallback(url:) routes by host
  → reads: action=login, reason=account_exists
  → sets errorMessage = "You already have an account. Please log in."
  → LoginView shows native alert with [Log In] / [Cancel] buttons
  → [Log In] → triggers startLogin() (new panel opens for login)
```

---

## Flow 4 — Forgot Password / Account Recovery

### Stage 1 — Panel Open (Email Entry)

```
App
  → opens ASWebAuthenticationSession:
      fotolokashen.com/forgot-password?source=ios

User enters email → submits
  → POST /api/auth/forgot-password
  → Backend always returns success (anti-enumeration)

ForgotPasswordForm.tsx detects: source=ios + submitted
  → redirects: fotolokashen://await-password-reset

Panel auto-closes
App shows native "Check Your Email" screen
```

### Stage 2 — No Panel (Email → Safari → Reset)

```
User opens email → taps reset link → opens in regular Safari:
  fotolokashen.com/reset-password?token=xxx

User sets new password → submits
  → POST /api/auth/reset-password { token, password }
  → Server: hashes token → finds user → updates passwordHash
  → Server: invalidates all existing sessions

Reset page shows success.
For iOS users (if we can detect): redirects to fotolokashen://password-reset-complete
Otherwise: "Go to Login" button
```

> **Resolved:** The forgot-password API now passes `platform` from the request body to `sendPasswordResetEmail()`, which appends `&platform=ios` to the reset link. The `ResetPasswordForm` detects `?platform=ios` and redirects to `fotolokashen://password-reset-complete` on success.

### Stage 3 — App Receives Completion

```
App receives: fotolokashen://password-reset-complete
  → DeepLinkManager routes this
  → shows native alert: "Your password has been updated. Please log in."
  → [Log In] → triggers startLogin()
```

---

## `ASWebAuthenticationSession` Callback Routing ✅ Implemented

`handleCallback(url:)` now routes by URL host instead of assuming every URL is an OAuth callback:

```swift
// AuthService.swift — handleCallback routes by url.host
switch host {
case "oauth-callback":
    // Standard PKCE code exchange
    guard let code = ... else { return }
    try await exchangeCodeForTokens(code: code)

case "await-verification":
    // Registration success — show native "check email" UI
    awaitingVerification = true

case "await-password-reset":
    // Forgot password submitted — show native "check email" UI
    awaitingPasswordReset = true

case "auth-redirect":
    // Error redirect — parse action + reason
    if action == "login" && reason == "account_exists" {
        errorMessage = "You already have an account. Please log in."
    }

default: break
}
```

> **Key insight:** Only `email-verified` and `password-reset-complete` arrive via regular Safari deep links (handled by `DeepLinkManager`). All others arrive via the `ASWebAuthenticationSession` completion handler (handled by `AuthService`).

---

## Platform Detection — Explicit vs. Inferred

### Current approach (fragile)
Backend infers iOS from `User-Agent`:
```typescript
if (ua.includes('iphone') || ua.includes('ipad')) {
    deviceType = 'mobile-browser-ios';
}
```
This can fail on desktop Safari running iOS user-agent strings, VPNs, or future UA format changes.

### Ideal approach (explicit)
`AuthService` passes `?source=ios` on every URL it opens:
```swift
// AuthService.startRegistration() — add source=ios
components.queryItems = [
    URLQueryItem(name: "source", value: "ios"),
    URLQueryItem(name: "client_id", value: config.oauthClientId),
    // ... existing params
]
```

Web pages read `useSearchParams()` and trust `?source=ios` as ground truth. User-Agent detection becomes a secondary fallback for the verification email (where we don't control the URL the user opens from).

---

## Token Architecture

All sensitive tokens follow the same pattern: **raw token to the user, hash stored in DB.**

```
Generate:  crypto.randomBytes(32).toString('hex')  →  rawToken
Send:      rawToken in email URL or deep link
Store:     SHA-256(rawToken) in database
Verify:    SHA-256(incomingToken) → database lookup
```

| Token | Expiry | Single-use? | Status |
|---|---|---|---|
| `verificationToken` | 30 minutes | Yes (cleared on verify) | ✅ Hashed |
| `resetToken` | 15 minutes | Yes (cleared on reset) | ✅ Hashed |
| `autoLoginToken` | 5 minutes | Yes (cleared immediately) | ✅ Hashed |
| `refreshToken` | 30 days | No (valid until revoked) | Stored as-is in `OAuthRefreshToken` table |

---

## Universal Links vs Custom Scheme

| | Custom Scheme `fotolokashen://` | Universal Links `https://fotolokashen.com/...` |
|---|---|---|
| Setup | `Info.plist` URL scheme | AASA file + entitlements |
| Security | Can be registered by another app | Domain-verified, cannot be hijacked |
| Works in `ASWebAuthenticationSession` | ✅ | ✅ |
| Apple recommendation | Acceptable | Preferred for OAuth redirects |

### Current Fotolokashen State ✅ Complete
- **Entitlements**: `applinks:fotolokashen.com` and `webcredentials:fotolokashen.com` ✅ configured
- **AASA file**: `["/shared/*", "/app/auth-callback"]` ✅ auth path added
- **OAuth callback**: ✅ Universal Link on iOS 17.4+ (`https://fotolokashen.com/app/auth-callback`)
  - Falls back to custom scheme on iOS 17.0-17.3
  - `.https()` callback API (17.4+) or `.callbackURLScheme` (17.0-17.3)
- **Fallback page**: `/app/auth-callback` handles case where app isn't installed
- **OAuthClient**: Universal Link registered in allowed redirect URIs

---

## Web Page Contract for iOS

Every auth page that may be opened inside `ASWebAuthenticationSession` must:

| Requirement | Reason |
|---|---|
| Read `?source=ios` from URL params | Detect iOS context explicitly |
| On success → `window.location.href` to `fotolokashen://` | Closes panel, returns control to app |
| On `EMAIL_EXISTS` error → redirect with reason | Toast/modal invisible in panel |
| On fixable errors → inline field errors | User stays in panel, fixes and retries |
| Mobile layout optimized for < 640px | Panel is narrow; hide header/logo |
| No app JS state dependencies | Panel is sandboxed |
| **Never show a "you're done" state** in the panel | The app owns post-action UI |
---

## Flow 5 — Token Refresh

```
iOS app detects: access_token expired or about to expire (< 5 min)
  → KeychainService.needsRefresh() returns true

AuthService.refreshToken()
  → POST /api/auth/oauth/token {
        grant_type: "refresh_token",
        refresh_token: <current_refresh_token>,
        client_id: "fotolokashen-ios"
      }
  ← { access_token, refresh_token, expires_in, token_type }
  → Old refresh token is revoked server-side (rotation)
  → New tokens saved to Keychain
  → Transparent to the user — no re-login needed

If refresh fails (revoked, expired, 401):
  → Clear Keychain
  → isAuthenticated = false → LoginView appears
```

> **Token rotation:** Every refresh issues a NEW refresh token and revokes the old one. This means a stolen refresh token can only be used once — the legitimate user's next refresh will fail (old token revoked), alerting them to compromise.

---

## Flow 6 — Logout

```
User taps Logout in profile/settings
  → AuthService.logout()
  → POST /api/auth/oauth/revoke {
        token: <refresh_token>,
        client_id: "fotolokashen-ios"
      }
  → Server: marks refresh token as revoked
  → KeychainService.clearTokens() — removes access + refresh from Keychain
  → isAuthenticated = false, currentUser = nil
  → LoginView appears
```

---

## Flow 7 — Authenticated Profile Changes

These flows happen **inside the app** (not in a Safari panel). The user is already authenticated and making changes from their profile/settings screen.

### Change Password

```
User enters current password + new password
  → POST /api/auth/change-password {
        currentPassword, newPassword, confirmPassword
      }
  → Server: verifies current password (bcrypt compare)
  → Server: hashes new password, updates user
  → Server: invalidates ALL OTHER sessions (keeps current)
  → Server: revokes ALL refresh tokens
  → Server: sends notification email to user
    ("Your password was changed on [date] from [IP]")
  → iOS app: on success, user stays logged in on current device
    (all other devices are kicked out)
```

### Change Email (Two-Step)

```
Step 1 — Request:
  User enters new email + current password
  → POST /api/auth/change-email/request { newEmail, currentPassword }
  → Server: verifies current password
  → Server: checks new email availability
  → Server: generates verification token, stores SHA-256 hash
  → Server: sends verification email to NEW address
  → Server: sends alert to OLD address
    ("Someone requested to change your email to [newEmail]")

Step 2 — Verify:
  User clicks link in email sent to NEW address
  → POST /api/auth/change-email/verify { token }
  → Server: validates token
  → Server: swaps email (old → new)
  → Server: sends confirmation to NEW email
  → Server: sends notification to OLD email
  → Server: invalidates ALL sessions (force re-login)
  → iOS app: next API call returns 401 → auto-logout → user logs in with new email
```

### Change Username

```
  → POST /api/auth/change-username { newUsername }
  → Server: checks availability → 409 USERNAME_TAKEN if taken
  → Server: updates username
  → No password required (not a security credential)
  → No session invalidation
```

---

## Security Audit Log

All security-sensitive operations are logged to the `SecurityEvent` table with:
- `userId`, `eventType`, `ipAddress`, `userAgent`, `success`, `metadata`, `timestamp`

| Event Type | When Logged |
|---|---|
| `login` | Successful login |
| `failed_login` | Wrong password |
| `logout` | User logout |
| `password_change` | Password changed from profile |
| `password_reset_request` | Forgot password submitted |
| `password_reset_success` | Password reset completed |
| `email_change` | Email change requested, verified, or cancelled |
| `email_verification` | Email verified |
| `session_created` | New session/token issued |
| `session_revoked` | Session or refresh token revoked |

---

## Gap Analysis — Fotolokashen vs. Ideal ✅ All Complete

| Flow | Current State |
|---|---|
| **Login** | ✅ PKCE + Universal Link (17.4+) |
| **Register → success** | ✅ Redirects `await-verification` |
| **Register → email exists** | ✅ Redirects `auth-redirect?reason=account_exists` |
| **Register → email verified** | ✅ Auto-redirects with `autoLoginToken` |
| **Forgot password → submitted** | ✅ Redirects `await-password-reset` |
| **Reset password → complete** | ✅ Redirects `password-reset-complete` |
| **`handleCallback` routing** | ✅ Routes by URL host (HTTPS + custom scheme) |
| **Platform detection** | ✅ Explicit `?source=ios` |
| **Token hashing** | ✅ SHA-256 for all auth tokens |
| **iOS native UI** | ✅ Sheets + alerts for all auth states |
| **OAuth redirect URI** | ✅ Universal Link (iOS 17.4+, backward compatible) |

---

## Files Changed (April 2026 Implementation)

### Web — `fotolokashen` ✅ Complete

| File | Change |
|---|---|
| `RegisterForm.tsx` | ✅ iOS-aware: `await-verification` + `auth-redirect` redirects |
| `ForgotPasswordForm.tsx` | ✅ iOS-aware: `await-password-reset` redirect, sends `platform` |
| `ResetPasswordForm.tsx` | ✅ iOS-aware: `password-reset-complete` redirect |
| `verify-email/page.tsx` | ✅ Auto-redirect for iOS first-time verifications |
| `email.ts` | ✅ `sendPasswordResetEmail()` accepts `platform` param |
| `forgot-password API` | ✅ Pipes `platform` to email |
| `/app/auth-callback/page.tsx` | ✅ Universal Link fallback page |
| `seed-oauth-clients.ts` | ✅ Universal Link redirect URI added |
| `apple-app-site-association` | ✅ `/app/auth-callback` path added |

### iOS — `fotolokashen-ios` ✅ Complete

| File | Change |
|---|---|
| `AuthService.swift` | ✅ Universal Link login (17.4+), callback routing (HTTPS + custom), forgot password, published states |
| `ContentView.swift` | ✅ LoginView: check-email sheets, account-exists alert, password-reset alert, forgot password button |
| `DeepLinkManager.swift` | ✅ `passwordResetComplete` handler |

