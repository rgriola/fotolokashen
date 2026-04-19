# Ideal Auth System — Web + iOS

> **Purpose:** Reference architecture for a cross-platform auth system connecting a Next.js web app to an iOS app, accounting for Apple's mandatory `ASWebAuthenticationSession` (Safari panel) requirement.
>
> **Status:** Design target. See the gap analysis at the bottom for what Fotolokashen still needs to reach this state.
>
> **Last reviewed against codebase:** April 19, 2026

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
// AuthService.swift line 222-224
let session = ASWebAuthenticationSession(
    url: url,
    callbackURLScheme: "fotolokashen"  // ← ALL fotolokashen:// URLs close the panel
)
```
The `callbackURLScheme` is set to `"fotolokashen"`, which means **any** URL starting with `fotolokashen://` will:
1. Close the Safari panel
2. Deliver the URL to the session's completion handler
3. The completion handler currently calls `handleCallback(url:)` which **only looks for `?code=xxx`**

This means new redirect schemes (`fotolokashen://await-verification`, `fotolokashen://auth-redirect`, etc.) will automatically close the panel — which is the desired behavior — but `handleCallback` must be updated to route these URLs differently instead of always expecting an OAuth `code`.

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
  → opens ASWebAuthenticationSession:
      fotolokashen.com/login?
        client_id=xxx
        &redirect_uri=fotolokashen://oauth-callback
        &code_challenge=xxx
        &code_challenge_method=S256
        &scope=read+write
        &response_type=code

User logs in on web page
  → server validates credentials
  → server issues authorization code
  → server redirects: fotolokashen://oauth-callback?code=xxx

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes
  → completion handler fires with callbackURL

AuthService.handleCallback(url:)
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

> **Current behavior note:** The verify-email page does NOT auto-redirect for first-time verifications on iOS. It shows a manual "Continue to fotolokashen" button. Auto-redirect only fires for the `alreadyVerified` edge case. For the ideal flow, we should add a timed auto-redirect (2-3 seconds) for the `platform=ios + success` case, matching the `alreadyVerified` behavior.

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

## Flow 3 — Email Already Exists

### Current behavior (broken)
1. `POST /api/auth/register` returns `409 { error: "Email already registered", code: "EMAIL_EXISTS" }`
2. `RegisterForm.tsx` line 129: `toast.error(result.error)` — toast renders in web page
3. `ASWebAuthenticationSession` panel has no Sonner `<Toaster>` mounted — toast may show as an HTML-only element but with poor UX
4. Panel stays open with only a small inline error — user has no clear path to login
5. User must manually close the panel

### Ideal behavior

```
User submits registration form with existing email
  → POST /api/auth/register → 409 EMAIL_EXISTS

RegisterForm.tsx detects: source=ios + EMAIL_EXISTS
  → shows inline message (not toast): "You already have an account."
  → after 1.5s: window.location.href = fotolokashen://auth-redirect?action=login&reason=account_exists

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes
  → completion handler fires with auth-redirect URL

AuthService routes the URL
  → reads: action=login, reason=account_exists
  → sets errorMessage = "You already have an account. Please log in."
  → or shows native alert with [Log In] / [Cancel] buttons
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

> **Challenge:** By stage 2 the user is in regular Safari (not the auth panel). We can't easily detect iOS context here unless the reset email link includes `&platform=ios`. Currently the forgot-password API does **not** pass platform to the reset email template — only the register API does. This would require an additional change to `sendPasswordResetEmail()`.

### Stage 3 — App Receives Completion

```
App receives: fotolokashen://password-reset-complete
  → DeepLinkManager routes this
  → shows native alert: "Your password has been updated. Please log in."
  → [Log In] → triggers startLogin()
```

---

## `ASWebAuthenticationSession` Callback Routing

Currently `handleCallback(url:)` assumes every URL is an OAuth callback with `?code=xxx`. To support the new deep link schemes, the callback handler must route by URL host:

```swift
// AuthService — updated handleCallback
func handleCallback(url: URL) async {
    guard let host = url.host else { return }
    
    switch host {
    case "oauth-callback":
        // Existing PKCE flow
        guard let code = URLComponents(url: url, ...)?.queryItems?
            .first(where: { $0.name == "code" })?.value else { return }
        try await exchangeCodeForTokens(code: code)
        
    case "await-verification":
        // Registration success — show native "check email" UI
        isLoading = false
        // Post notification or set state for LoginView to observe
        
    case "auth-redirect":
        // Error redirect — parse action + reason
        let params = URLComponents(url: url, ...)?.queryItems
        let action = params?.first(where: { $0.name == "action" })?.value
        let reason = params?.first(where: { $0.name == "reason" })?.value
        handleAuthRedirect(action: action, reason: reason)
        
    case "await-password-reset":
        // Forgot password submitted — show native "check email" UI
        isLoading = false
        
    default:
        break
    }
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

### Current Fotolokashen State
- **Entitlements**: `applinks:fotolokashen.com` and `webcredentials:fotolokashen.com` ✅ configured
- **AASA file**: Exists at `public/.well-known/apple-app-site-association` ✅
  - `applinks` paths: `["/shared/*"]` — only location sharing links
  - `webcredentials` — enables Safari AutoFill password integration
- **OAuth callback**: Still uses custom scheme `fotolokashen://oauth-callback`

**Recommendation:** Extend the AASA `paths` array to include `/app/auth-callback` and migrate the OAuth redirect_uri to a Universal Link. This prevents another app from hijacking the auth callback. The existing `/shared/*` links demonstrate the infrastructure already works.

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

## Gap Analysis — Fotolokashen vs. Ideal

| Flow | Ideal State | Current State | Effort |
|---|---|---|---|
| **Login** | PKCE → redirect → tokens | ✅ Working | — |
| **Register → success** | Web redirects to `await-verification`; panel auto-closes | ❌ Shows "Check Email" card inside panel; user must manually close | Small |
| **Register → email exists** | Web redirects to `auth-redirect?reason=account_exists` | ❌ Toast error; panel stuck open | Small |
| **Register → email verified** | verify-email auto-redirects to `email-verified?token=` | ⚠️ Shows manual button; no auto-redirect for iOS | Small |
| **Forgot password → submitted** | Web redirects to `await-password-reset` | ❌ Shows success message inside panel | Small |
| **Reset password → complete** | Web redirects to `password-reset-complete` | ❌ Shows success in browser; no app return | Small |
| **`handleCallback` routing** | Routes by URL host (oauth vs await vs redirect) | ❌ Only parses `?code=` | Small |
| **Platform detection** | Explicit `?source=ios` param | ⚠️ User-Agent sniffing (fragile) | Small |
| **verify-email auto-redirect** | Auto-redirect after 2-3s for `platform=ios` | ⚠️ Only auto-redirects for `alreadyVerified` case | Small |
| **OAuth redirect URI** | Universal Link | ⚠️ Custom URL scheme (AASA infra exists but unused for auth) | Medium |
| **Token hashing** | SHA-256 for all auth tokens | ✅ Implemented April 2026 | — |

### Priority Order

1. **High — `handleCallback` routing** — Must be done first; all other panel-based redirects depend on it
2. **High — Register email exists → redirect** — Active UX bug reported by user
3. **High — Register success → close panel** — Poor UX; user stuck in panel
4. **Medium — Forgot password → close panel** — Same pattern as #3
5. **Medium — Explicit `?source=ios`** — Replaces fragile User-Agent sniffing
6. **Medium — verify-email auto-redirect for iOS** — Currently requires manual tap
7. **Medium — Reset password → redirect to app** — Requires piping `platform` through reset email
8. **Low — Universal Links for OAuth** — AASA infrastructure already exists; extend paths

---

## Files to Change (When Implementing)

### iOS — `fotolokashen-ios`

| File | Change |
|---|---|
| `AuthService.swift` → `startRegistration()` | Add `?source=ios` to URL |
| `AuthService.swift` → `handleCallback(url:)` | Route by `url.host` instead of always parsing `?code=` |
| `AuthService.swift` | Add `startForgotPassword()` method that opens panel with `?source=ios` |
| `DeepLinkManager.swift` | Add handlers for `password-reset-complete` (same pattern as `email-verified`) |
| `LoginView` / `ContentView` | React to new states: `awaitingVerification`, `awaitingPasswordReset`, `accountExists` |

### Web — `fotolokashen`

| File | Change |
|---|---|
| `RegisterForm.tsx` | Read `?source=ios`; on success → redirect `await-verification`; on `EMAIL_EXISTS` → redirect `auth-redirect` |
| `ForgotPasswordForm.tsx` | Read `?source=ios`; on submit → redirect `await-password-reset` |
| `verify-email/page.tsx` | Add auto-redirect timer for `platform=ios + success` (don't only do it for `alreadyVerified`) |
| `reset-password page` | On success + `platform=ios` → redirect `password-reset-complete` |
| `sendPasswordResetEmail()` in `email.ts` | Accept optional `platform` param, append `&platform=ios` to reset link |
