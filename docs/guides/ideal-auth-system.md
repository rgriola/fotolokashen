# Ideal Auth System — Web + iOS

> **Purpose:** Reference architecture for a cross-platform auth system connecting a Next.js web app to an iOS app, accounting for Apple's mandatory `ASWebAuthenticationSession` (Safari panel) requirement.
>
> **Status:** Design target. See the gap analysis at the bottom for what Fotolokashen still needs to reach this state.

---

## The Core iOS Constraint

Apple's App Store Review Guideline 4.8 **mandates** `ASWebAuthenticationSession` for all OAuth and login flows. Using `WKWebView` for authentication is grounds for rejection.

**What `ASWebAuthenticationSession` is:**
- A system-managed Safari panel — not your app's browser, not `WKWebView`
- Shares cookies with Safari but is sandboxed from your app
- **Automatically closes itself** the moment it intercepts a URL matching your registered scheme (`fotolokashen://`)
- Has no bridge to your app's UI, JavaScript state, or component libraries

That last point is critical: **toast notifications, modals, and any app-rendered UI do not appear inside the panel.** Only the web page itself is visible.

---

## The One Rule

> **Every iOS auth flow must end with a deep link redirect — every time.**

The panel should never require the user to manually close it. The web page drives itself to a `fotolokashen://something` URL, which auto-closes the panel and hands control back to the native app. The app then owns the next step.

---

## Deep Link Registry (Complete)

| Deep Link | Trigger | App Action |
|---|---|---|
| `fotolokashen://oauth-callback?code=xxx` | Login complete | Exchange code → tokens → authenticated |
| `fotolokashen://await-verification` | Registration submitted | Close panel; show native "Check your email" state |
| `fotolokashen://email-verified?token=xxx` | Email link tapped | Call `POST /api/auth/auto-login` → auto-login |
| `fotolokashen://await-password-reset` | Forgot-password form submitted | Close panel; show native "Check your email" state |
| `fotolokashen://password-reset-complete` | Password reset successfully | Close panel; show native "Password updated" → prompt login |
| `fotolokashen://auth-redirect?action=&reason=` | Error routing (e.g. account exists) | Close panel; handle reason with native UI |

---

## Flow 1 — Login ✅

Standard OAuth 2.0 PKCE. This pattern is already correct.

```
App
  → generates code_verifier + code_challenge
  → opens ASWebAuthenticationSession:
      fotolokashen.com/login?
        client_id=xxx
        &redirect_uri=fotolokashen://oauth-callback
        &code_challenge=xxx
        &response_type=code

User logs in on web page
  → server validates credentials
  → server issues authorization code
  → server redirects: fotolokashen://oauth-callback?code=xxx

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes
  → app receives code

App
  → POST /api/auth/oauth/token { code, code_verifier, client_id }
  → receives access_token + refresh_token
  → saves to Keychain
  → isAuthenticated = true
```

---

## Flow 2 — Create Account

The challenge: registration is a 3-stage flow. The panel should only be open for **stage 1**. Stages 2 and 3 happen outside the panel.

### Stage 1 — Panel Open (Registration Form)

```
App
  → opens ASWebAuthenticationSession:
      fotolokashen.com/register?
        source=ios
        &client_id=xxx

User fills form → submits
  → POST /api/auth/register
  → Backend: creates user (emailVerified: false)
  → Backend: sends verification email with &platform=ios in link
  → Backend: returns 201 success

Web page detects: source=ios + success
  → redirects to: fotolokashen://await-verification

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes ← user is back in the native app

App
  → shows native "Check Your Email" screen
  → no more panel open
```

### Stage 2 — No Panel (Email Client)

```
User opens email on device
  → taps verification link
  → link opens in regular Safari (not the panel):
      fotolokashen.com/verify-email?token=xxx&platform=ios

Server
  → hashes incoming token → finds user
  → sets emailVerified = true
  → generates one-time autoLoginToken (expires 5 min)
  → stores SHA-256(autoLoginToken) in DB
  → page redirects to: fotolokashen://email-verified?token=<rawAutoLoginToken>

iOS receives deep link via Universal Link or custom scheme
```

### Stage 3 — No Panel (App Handles Directly)

```
App receives: fotolokashen://email-verified?token=xxx
  → POST /api/auth/auto-login {
        token: xxx,          ← raw token (server will hash to verify)
        client_id: xxx,
        device_name: "iPhone 15"
      }
  ← access_token + refresh_token
  → saved to Keychain
  → isAuthenticated = true
  → native "Check Email" screen dismissed
```

---

## Flow 3 — Email Already Exists (Current Bug in Fotolokashen)

### Current (broken) behavior
- Registration API returns `409 EMAIL_EXISTS`
- Web form shows a toast — which is invisible inside `ASWebAuthenticationSession`
- Panel stays open with no clear path forward
- User must manually close the panel

### Ideal behavior

```
User submits registration form with existing email
  → POST /api/auth/register → 409 EMAIL_EXISTS

Web page detects: source=ios + EMAIL_EXISTS error code
  → shows brief inline message (no toast):
      "You already have an account. Redirecting to login..."
  → after 1.5 seconds:
      redirects to fotolokashen://auth-redirect?action=login&reason=account_exists

ASWebAuthenticationSession intercepts fotolokashen://
  → panel auto-closes ← user is back in the native app

App receives deep link
  → reads: action=login, reason=account_exists
  → shows native alert:
      "You already have an account.
       Would you like to log in?"
      [Log In]  [Cancel]
  → [Log In] → triggers login flow (new ASWebAuthenticationSession opens)
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
  → Backend sends reset email (always returns success to prevent enumeration)

Web page detects: source=ios + request submitted
  → immediately redirects: fotolokashen://await-password-reset

Panel auto-closes ← user is back in the native app

App
  → shows native "Check Your Email" screen
  → no more panel open
```

### Stage 2 — No Panel (Email Client)

```
User opens email
  → taps reset link → opens in regular Safari:
      fotolokashen.com/reset-password?token=xxx

User sets new password → submits
  → POST /api/auth/reset-password { token, password }
  → Backend: hashes incoming token → finds user
  → Backend: updates passwordHash, clears resetToken, invalidates all sessions

Web page (still in regular Safari)
  → detects success
  → redirects to: fotolokashen://password-reset-complete

iOS receives deep link
```

### Stage 3 — App Receives Completion

```
App receives: fotolokashen://password-reset-complete
  → shows native alert:
      "Your password has been updated.
       Please log in with your new password."
      [Log In]
  → [Log In] → triggers login flow
```

---

## Platform Detection — Explicit vs. Inferred

### Current approach (fragile)
The backend infers iOS context from the `User-Agent` header:
```typescript
if (ua.includes('iphone') || ua.includes('ipad')) {
    deviceType = 'mobile-browser-ios';
}
```
This can fail on non-standard browsers, VPNs, or future UA changes.

### Ideal approach (explicit)
`AuthService` appends `?source=ios` to every URL it opens:
```swift
// AuthService.swift
var components = URLComponents(string: "\(backendURL)/register")!
components.queryItems = [
    URLQueryItem(name: "source", value: "ios"),
    URLQueryItem(name: "client_id", value: clientID),
]
```

Web pages read `useSearchParams()` and trust `?source=ios` as ground truth. User-Agent detection becomes a secondary fallback only.

---

## Token Architecture

All sensitive tokens follow the same pattern: **raw token to the user, hash stored in DB.**

```
Generate:  crypto.randomBytes(32).toString('hex')  →  rawToken
Send:      rawToken in email URL / deep link
Store:     SHA-256(rawToken) in database
Verify:    SHA-256(incomingToken) → database lookup
```

| Token | Expiry | Single-use? |
|---|---|---|
| `verificationToken` | 30 minutes | Yes (cleared on use) |
| `resetToken` | 15 minutes | Yes (cleared on use) |
| `autoLoginToken` | 5 minutes | Yes (cleared immediately on use) |
| `refreshToken` | 30 days | No (valid until revoked) |

---

## Custom URL Scheme vs. Universal Links

| | Custom Scheme `fotolokashen://` | Universal Links `https://fotolokashen.com/app/...` |
|---|---|---|
| Setup | `Info.plist` only | Requires `apple-app-site-association` file on server + entitlements |
| Security | Can be registered by another app | Domain-verified — cannot be hijacked |
| Works in `ASWebAuthenticationSession` | ✅ | ✅ |
| Apple recommendation | Acceptable | Preferred for OAuth `redirect_uri` |
| Current Fotolokashen usage | All redirects | Not implemented |

**Recommendation:** Migrate the `oauth-callback` (login) redirect to a Universal Link. The simpler intermediate redirects (`await-verification`, `auth-redirect`, etc.) can stay on custom scheme — the security stakes for those are lower since they carry no sensitive tokens.

---

## Web Page Requirements Summary

For every auth page that iOS opens in a panel, the web implementation must:

| Requirement | Notes |
|---|---|
| Read `?source=ios` param | Detect iOS context explicitly |
| On success → redirect to `fotolokashen://` | Never show "you're done" UI in the panel |
| On `EMAIL_EXISTS` error → redirect with reason | Never rely on toast/modal in the panel |
| On all other errors → show inline field error | These are actionable; user stays in panel to fix |
| Mobile-optimized layout (< 640px) | Panel is narrow; headers, logos hidden |
| No JavaScript dependencies on app state | Panel is sandboxed — app JS context doesn't exist |

---

## Gap Analysis — Fotolokashen vs. Ideal

| Flow | Ideal State | Current State | Gap |
|---|---|---|---|
| **Login** | PKCE → redirect → tokens | ✅ Working | None |
| **Register → success** | Redirect to `await-verification` | ❌ Shows "Check Email" card in panel | Web page + 1 deep link handler |
| **Register → email exists** | Redirect to `auth-redirect?reason=account_exists` | ❌ Shows invisible toast; panel stuck | Web page + 1 deep link handler |
| **Forgot password → submitted** | Redirect to `await-password-reset` | ❌ Shows result in panel | Web page + 1 deep link handler |
| **Reset password → complete** | Redirect to `password-reset-complete` | ❌ Shows result in browser; no app return | Web page + 1 deep link handler |
| **Platform detection** | Explicit `?source=ios` param | ⚠️ User-Agent sniffing (fragile) | `AuthService.startRegistration()` + web pages |
| **oauth-callback redirect** | Universal Link | ⚠️ Custom URL scheme | AASA file + entitlements (lower priority) |
| **autoLoginToken security** | SHA-256 hashed | ✅ Implemented (April 2026) | None |
| **verificationToken security** | SHA-256 hashed | ✅ Implemented (April 2026) | None |

### Priority Order for Remaining Work

1. **High** — Register email exists → deep link redirect (active UX bug)
2. **High** — Register success → close panel immediately (poor UX today)
3. **Medium** — Forgot password → close panel immediately
4. **Medium** — Reset password success → deep link to app
5. **Medium** — Explicit `?source=ios` param (replaces User-Agent sniffing)
6. **Low** — Universal Links for oauth-callback

---

## Files to Change (When Implementing)

### Web — `fotolokashen`

| File | Change |
|---|---|
| `src/components/auth/RegisterForm.tsx` | Read `?source=ios`; on success redirect to `await-verification`; on `EMAIL_EXISTS` redirect to `auth-redirect?reason=account_exists` |
| `src/components/auth/ForgotPasswordForm.tsx` | Read `?source=ios`; on submit success redirect to `await-password-reset` |
| `src/app/reset-password/page.tsx` | Read `?source=ios` (from original email link); on reset success redirect to `password-reset-complete` |

### iOS — `fotolokashen-ios`

| File | Change |
|---|---|
| `AuthService.swift` | Add `?source=ios&client_id=xxx` to `startRegistration()` and `startForgotPassword()` URLs |
| `DeepLinkManager.swift` | Add handlers for `await-verification`, `await-password-reset`, `password-reset-complete`, `auth-redirect` |
| `LoginView` / `ContentView` | React to new deep link states; show appropriate native UI |
