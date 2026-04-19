# Cross-Platform Auth System — Agent Implementation Guide

> **Purpose:** Phased prompt guide for an AI agent to implement a complete OAuth 2.0 PKCE authentication system connecting a Next.js web app to an iOS (SwiftUI) app. Designed for one-shot execution per phase.
>
> **Stack assumed:** Next.js (App Router) · Prisma · PostgreSQL · SwiftUI · ASWebAuthenticationSession
>
> **Adapt before use:** Replace placeholder values (app name, URL scheme, bundle ID, domain) with your project's values.

---

## Configuration Block

Update these values before handing any phase to an agent:

```yaml
APP_NAME: "YourApp"
DOMAIN: "yourapp.com"
URL_SCHEME: "yourapp"                      # iOS custom URL scheme
BUNDLE_ID: "com.yourcompany.yourapp"
TEAM_ID: "XXXXXXXXXX"                      # Apple Developer Team ID
OAUTH_CLIENT_ID: "ios-app"
DB_PROVIDER: "postgresql"                  # postgresql, mysql, sqlite
CSS_FRAMEWORK: "tailwind"                  # tailwind, vanilla
IOS_MIN_TARGET: "17.0"
```

---

## Architecture Overview

```
┌──────────────────────────────────┐
│ iOS App (SwiftUI)                │
│                                  │
│  ASWebAuthenticationSession      │──── opens ────→ Web auth pages
│  AuthService (PKCE)              │                 (login, register,
│  KeychainService (token store)   │                  forgot-password)
│  DeepLinkManager (URL routing)   │
│                                  │◄─── closes ───── fotolokashen://
│                                  │                  (auto-close panel)
└──────────────────────────────────┘
          │ API calls
          ▼
┌──────────────────────────────────┐
│ Next.js Backend                  │
│                                  │
│  POST /api/auth/register         │  Cookie sessions (web)
│  POST /api/auth/login            │  OAuth tokens (iOS)
│  POST /api/auth/oauth/token      │
│  POST /api/auth/auto-login       │
│  GET  /api/auth/verify-email     │
│  POST /api/auth/forgot-password  │
│  POST /api/auth/reset-password   │
│                                  │
│  Prisma → PostgreSQL             │
└──────────────────────────────────┘
```

### The One Rule for iOS Auth UX

> **Every auth flow opened in a Safari panel MUST end with a redirect to your custom URL scheme.** The panel never requires the user to manually close it. Web pages drive themselves to a `yourapp://` redirect which auto-closes the panel and returns control to native code.

### Deep Link Registry

| Deep Link | When Fired | App Response |
|---|---|---|
| `yourapp://oauth-callback?code=xxx` | Login success | PKCE code exchange → tokens → authenticated |
| `yourapp://await-verification` | Registration success | Close panel → native "Check your email" UI |
| `yourapp://email-verified?token=xxx` | Email verification link tapped | `POST /api/auth/auto-login` → tokens → authenticated |
| `yourapp://await-password-reset` | Forgot password submitted | Close panel → native "Check your email" UI |
| `yourapp://password-reset-complete` | Password reset success | Close panel → prompt login |
| `yourapp://auth-redirect?action=&reason=` | Error routing (account exists, etc.) | Close panel → handle with native UI |

---

## Phase 1 — Database Schema & Core Auth Library

### Prompt for Agent

```
You are implementing the authentication backend for [APP_NAME].
Stack: Next.js 14+ App Router, Prisma, PostgreSQL.

Create the following:

1. PRISMA SCHEMA — Add these models to schema.prisma:

   User:
   - id (Int, autoincrement)
   - email (String, unique)
   - username (String, unique)
   - passwordHash (String)
   - firstName, lastName (String, optional)
   - dateOfBirth (DateTime, optional)
   - emailVerified (Boolean, default false)
   - verificationToken (String, optional) — stored as SHA-256 hash
   - verificationTokenExpiry (DateTime, optional)
   - resetToken (String, optional) — stored as SHA-256 hash
   - resetTokenExpiry (DateTime, optional)
   - autoLoginToken (String, optional) — stored as SHA-256 hash
   - autoLoginTokenExpiry (DateTime, optional)
   - role (String, default "user")
   - createdAt, updatedAt (DateTime)
   - deletedAt (DateTime, optional) — soft delete

   Session:
   - id (String, cuid)
   - userId (Int, FK → User)
   - token (String, unique) — JWT
   - expiresAt (DateTime)
   - deviceType (String, optional)
   - deviceName (String, optional)
   - userAgent (String, optional)
   - ipAddress (String, optional)
   - createdAt (DateTime)

   OAuthClient:
   - id (String, unique) — e.g. "ios-app"
   - name (String)
   - redirectUris (String[])
   - createdAt (DateTime)

   OAuthAuthorizationCode:
   - id (String, cuid)
   - code (String, unique)
   - clientId (String)
   - userId (Int, FK → User)
   - codeChallenge (String)
   - codeChallengeMethod (String, default "S256")
   - redirectUri (String)
   - scope (String)
   - expiresAt (DateTime)
   - used (Boolean, default false)
   - createdAt (DateTime)

   OAuthRefreshToken:
   - id (String, cuid)
   - token (String, unique)
   - clientId (String)
   - userId (Int, FK → User)
   - deviceName (String, optional)
   - userAgent (String, optional)
   - ipAddress (String, optional)
   - expiresAt (DateTime)
   - revoked (Boolean, default false)
   - createdAt (DateTime)

   Add indexes on: User.email, User.username, User.verificationToken, User.resetToken,
   User.autoLoginToken, Session.token, OAuthAuthorizationCode.code, OAuthRefreshToken.token

2. AUTH LIBRARY — Create src/lib/auth.ts:

   - hashPassword(password) — bcrypt with 10 salt rounds
   - comparePassword(password, hash) — bcrypt compare
   - generateToken(payload, expiresIn) — JWT sign with process.env.JWT_SECRET (NO fallback)
   - verifyToken(token) — JWT verify, return typed payload or null
   - generateVerificationToken() — crypto.randomBytes(32).toString('hex')
   - hashToken(token) — SHA-256 hex digest
   - JWT payload type: { userId: number, email: string, role: string }

   CRITICAL: hashToken() is used for ALL sensitive tokens (verification, reset, auto-login).
   Raw tokens are sent to users; only hashes are stored in DB.

3. API MIDDLEWARE — Create src/lib/api-middleware.ts:

   - requireAuth(request) — validates JWT from cookie or Authorization header
   - withAuth(handler) — HOF wrapper that handles auth + try/catch
   - withOptionalAuth(handler) — same but auth is optional
   - withAdmin(handler) — requires role === 'super_admin'
   - apiResponse(data, status) — consistent JSON response
   - apiError(message, status, code) — consistent error response
   - setAuthCookie(response, token, rememberMe)

4. RATE LIMITING — Create src/lib/rate-limit.ts:

   - In-memory rate limiter with configurable presets
   - Presets: LOGIN (10/15min), STRICT (5/15min), LENIENT (100/15min)
   - getIpAddress(request) — use LAST entry in x-forwarded-for (proxy-appended)
   - addRateLimitHeaders(headers, result) — X-RateLimit-* headers

5. Seed the OAuthClient table with: { id: "[OAUTH_CLIENT_ID]", name: "[APP_NAME] iOS",
   redirectUris: ["[URL_SCHEME]://oauth-callback"] }

Run: npx prisma migrate dev --name auth-system
```

---

## Phase 2 — Registration & Email Verification API

### Prompt for Agent

```
You are implementing registration and email verification for [APP_NAME].
The auth library from Phase 1 exists at src/lib/auth.ts and src/lib/api-middleware.ts.

Create the following API routes:

1. POST /api/auth/register (src/app/api/auth/register/route.ts):
   
   Input: { email, username, password, firstName?, lastName?, dateOfBirth }
   
   Validation (Zod):
   - email: valid email
   - username: 3-50 chars, [a-zA-Z0-9_-] only, forced lowercase, trimmed
   - password: 8+ chars, 1 uppercase, 1 lowercase, 1 number
   - dateOfBirth: ISO date string, must be 18+
   
   Logic:
   - Check email uniqueness → 409 EMAIL_EXISTS if taken
   - Check username uniqueness → 409 USERNAME_TAKEN if taken
   - Hash password with bcrypt
   - Generate verificationToken (crypto.randomBytes(32))
   - Store SHA-256(verificationToken) in user record (NOT the raw token)
   - Set verificationTokenExpiry to 30 minutes from now
   - Detect iOS via User-Agent header (iPhone/iPad → platform='ios')
   - Send verification email with link:
     [DOMAIN]/verify-email?token=[rawToken]&platform=[ios|undefined]
   - Return 201 { success: true, message: "Check your email" }
   - Apply STRICT rate limiting

2. GET /api/auth/verify-email (src/app/api/auth/verify-email/route.ts):
   
   Input: ?token=xxx&platform=ios (query params)
   
   Logic:
   - Hash incoming token with hashToken()
   - Look up user by hashed verificationToken
   - If not found → 400 INVALID_TOKEN
   - If expired → 400 TOKEN_EXPIRED
   - Set emailVerified = true, clear verificationToken fields
   - If platform === 'ios':
     - Generate autoLoginToken (crypto.randomBytes(32))
     - Store SHA-256(autoLoginToken) in user record
     - Set autoLoginTokenExpiry to 5 minutes
     - Return { success: true, autoLoginToken: rawToken }
   - Else: Return { success: true }

3. POST /api/auth/auto-login (src/app/api/auth/auto-login/route.ts):
   
   Input: { token, client_id, device_name, user_agent?, country? }
   
   Logic:
   - Hash incoming token with hashToken()
   - Look up user by hashed autoLoginToken
   - If not found or expired → 401
   - Clear autoLoginToken fields immediately (single-use)
   - Generate access_token (JWT, 1 hour expiry)
   - Generate refresh_token (crypto.randomBytes, 30 day expiry)
   - Store OAuthRefreshToken record
   - Return { access_token, refresh_token, expires_in, token_type: "Bearer", user }

4. POST /api/auth/resend-verification (src/app/api/auth/resend-verification/route.ts):
   
   Input: { email }
   Logic:
   - Find user by email, must not be verified
   - Generate new verificationToken, store hash, send email
   - Rate limit: max 3 per email per 15 minutes
   - Always return success (anti-enumeration)

5. EMAIL UTILITY — Create/update src/lib/email.ts:
   
   - sendVerificationEmail(email, rawToken, username, platform?)
     Build URL: [DOMAIN]/verify-email?token=[rawToken][&platform=ios]
   - sendWelcomeEmail(email, username)
   - sendPasswordResetEmail(email, rawToken, username, platform?)
     Build URL: [DOMAIN]/reset-password?token=[rawToken][&platform=ios]
```

---

## Phase 3 — Login, OAuth Token Exchange & Password Reset API

### Prompt for Agent

```
You are implementing login, OAuth PKCE token exchange, and password reset for [APP_NAME].
Phase 1 and 2 are complete. Auth library and registration are working.

Create the following:

1. POST /api/auth/login (src/app/api/auth/login/route.ts):
   
   Input: { email, password, rememberMe? }
   
   Logic:
   - Validate credentials
   - Check emailVerified — if false, generate new verificationToken, send email,
     return 403 EMAIL_NOT_VERIFIED
   - Generate JWT session token
   - Create Session record in DB
   - Set auth_token cookie (7d or 30d based on rememberMe)
   - Apply LOGIN rate limiting
   - Return { success: true, user }

   For iOS OAuth flow, login page also handles authorization:
   - Read query params: client_id, redirect_uri, code_challenge, response_type
   - If present: after successful login, generate authorization code instead of cookie
   - Store OAuthAuthorizationCode record (code, challenge, userId, expiry: 5 min)
   - Redirect to: [redirect_uri]?code=[authorizationCode]

2. POST /api/auth/oauth/token (src/app/api/auth/oauth/token/route.ts):
   
   Handles two grant types:
   
   a) grant_type=authorization_code:
      Input: { code, code_verifier, client_id, redirect_uri }
      - Look up OAuthAuthorizationCode by code
      - Verify PKCE: SHA-256(code_verifier) must match stored code_challenge
      - Mark code as used
      - Generate access_token (JWT, 1h) + refresh_token (random, 30d)
      - Store OAuthRefreshToken
      - Return { access_token, refresh_token, expires_in, token_type, user }
   
   b) grant_type=refresh_token:
      Input: { refresh_token, client_id }
      - Look up OAuthRefreshToken by token
      - Must not be revoked or expired
      - Generate new access_token + new refresh_token (rotate)
      - Revoke old refresh_token
      - Return new tokens

3. POST /api/auth/oauth/revoke (src/app/api/auth/oauth/revoke/route.ts):
   
   Input: { token, client_id }
   - Revoke the refresh token (set revoked = true)
   - Return { success: true }

4. POST /api/auth/forgot-password (src/app/api/auth/forgot-password/route.ts):
   
   Input: { email }
   Logic:
   - Find user by email
   - Generate resetToken, store SHA-256 hash, set 15 min expiry
   - Send password reset email
   - ALWAYS return success (anti-email-enumeration)
   - Rate limit: max 2 per email per 15 minutes (DB-backed)

5. POST /api/auth/reset-password (src/app/api/auth/reset-password/route.ts):
   
   Input: { token, password }
   Logic:
   - Hash incoming token, look up user by hashed resetToken
   - Validate not expired
   - Hash new password, update user
   - Clear resetToken fields
   - Invalidate all existing sessions for this user
   - Return { success: true }
```

---

## Phase 4 — Web UI (Registration, Login, Verification Pages)

### Prompt for Agent

```
You are building the web auth UI for [APP_NAME].
Stack: Next.js App Router, React, [CSS_FRAMEWORK].
The API routes from Phases 2-3 are complete and working.

CRITICAL iOS RULE: These pages will be opened inside iOS ASWebAuthenticationSession
(a Safari panel). When the URL contains ?source=ios, all success/error states must
redirect to [URL_SCHEME]:// deep links instead of showing in-page UI. The panel
auto-closes on any [URL_SCHEME]:// redirect.

Build these pages:

1. /register (src/app/register/page.tsx + src/components/auth/RegisterForm.tsx):
   
   Form fields: firstName, lastName, email, username, password, confirmPassword, dateOfBirth
   Username: force lowercase on input, strip trailing whitespace
   Password: strength meter (5 levels), match indicator on confirm
   DateOfBirth: picker component enforcing 18+ at UI level
   
   On submit success:
   - If ?source=ios in URL → window.location.href = '[URL_SCHEME]://await-verification'
   - Else → show "Check Your Email" success card
   
   On EMAIL_EXISTS error (409):
   - If ?source=ios → show brief inline message, then after 1.5s redirect:
     window.location.href = '[URL_SCHEME]://auth-redirect?action=login&reason=account_exists'
   - Else → show toast error "Email already registered"
   
   On USERNAME_TAKEN error (409):
   - Always show inline field error (user can fix and retry in panel)
   
   Footer link: "Have an account? Log in" → /login
   
   Mobile layout (< 640px): hide header/logo, compact spacing, no scrolling needed

2. /login (src/app/login/page.tsx + src/components/auth/LoginForm.tsx):
   
   Form: email, password, rememberMe checkbox
   On success: redirect or set cookie based on context
   
   If OAuth params present (client_id, code_challenge, redirect_uri):
   - After successful login, server generates auth code
   - Server redirects to: [URL_SCHEME]://oauth-callback?code=xxx
   - Panel auto-closes, iOS app receives code
   
   On EMAIL_NOT_VERIFIED:
   - If ?source=ios → redirect '[URL_SCHEME]://auth-redirect?action=verify&reason=not_verified'
   - Else → show "Check your email" with resend button
   
   Footer link: "Don't have an account? Sign up" → /register
   Forgot password link → /forgot-password

3. /verify-email (src/app/verify-email/page.tsx):
   
   Reads ?token= and ?platform= from URL
   Calls GET /api/auth/verify-email?token=xxx&platform=xxx
   
   On success:
   - If platform=ios AND autoLoginToken in response:
     → Auto-redirect after 2 seconds to:
       [URL_SCHEME]://email-verified?token=[autoLoginToken]
     → Show fallback button: "Continue to [APP_NAME]"
   - Else → show "Email Verified!" with "Go to Login" button
   
   On TOKEN_EXPIRED → show "Link expired" with resend option
   On INVALID_TOKEN → show "Invalid link" error

4. /forgot-password (src/app/forgot-password/page.tsx + ForgotPasswordForm.tsx):
   
   Form: email
   On submit:
   - If ?source=ios → window.location.href = '[URL_SCHEME]://await-password-reset'
   - Else → show "Check your email" success card

5. /reset-password (src/app/reset-password/page.tsx):
   
   Reads ?token= from URL
   Form: newPassword, confirmPassword
   On success:
   - If ?platform=ios → redirect to [URL_SCHEME]://password-reset-complete
   - Else → show "Password updated" with "Go to Login" button
```

---

## Phase 5 — iOS Auth Service & Deep Link Manager

### Prompt for Agent

```
You are implementing iOS authentication for [APP_NAME].
Stack: SwiftUI, iOS [IOS_MIN_TARGET]+, ASWebAuthenticationSession.
The web backend and auth pages from Phases 1-4 are complete.

CRITICAL: Apple requires ASWebAuthenticationSession for all OAuth flows (Guideline 4.8).
Never use WKWebView for authentication.

Create the following:

1. PKCE GENERATOR — Services/PKCEGenerator.swift:
   
   static func generate() -> (verifier: String, challenge: String)
   - verifier: 32 random bytes, base64url encoded
   - challenge: SHA-256(verifier), base64url encoded

2. KEYCHAIN SERVICE — Services/KeychainService.swift:
   
   Singleton. Stores/retrieves:
   - accessToken (JWT string)
   - refreshToken (string)
   - tokenExpiry (Date)
   
   Methods:
   - saveToken(OAuthToken)
   - getAccessToken() -> String?
   - getRefreshToken() -> String?
   - isTokenExpired() -> Bool
   - needsRefresh() -> Bool (true if < 5 min until expiry)
   - clearTokens()

3. OAUTH TOKEN MODEL — Models/OAuthToken.swift:
   
   struct OAuthToken {
       let accessToken: String
       let refreshToken: String
       let expiresIn: Int
       let tokenType: String
   }
   
   init(from response: TokenResponse) — maps API response

4. AUTH SERVICE — Services/AuthService.swift:
   
   @MainActor class, ObservableObject.
   
   Published properties:
   - isAuthenticated: Bool
   - currentUser: User?
   - isLoading: Bool
   - errorMessage: String?
   - awaitingVerification: Bool     ← NEW state for post-registration
   - awaitingPasswordReset: Bool    ← NEW state for post-forgot-password
   
   Core methods:
   
   a) startLogin():
      - Generate PKCE (verifier + challenge)
      - Build URL: [DOMAIN]/login?client_id=&redirect_uri=&code_challenge=&response_type=code
      - Call startWebAuthSession(url:)
   
   b) startRegistration():
      - Build URL: [DOMAIN]/register?source=ios&client_id=[OAUTH_CLIENT_ID]
      - Call startWebAuthSession(url:)
   
   c) startForgotPassword():
      - Build URL: [DOMAIN]/forgot-password?source=ios
      - Call startWebAuthSession(url:)
   
   d) startWebAuthSession(url:):
      - Create ASWebAuthenticationSession with callbackURLScheme: "[URL_SCHEME]"
      - prefersEphemeralWebBrowserSession = false (share cookies with Safari)
      - On callback: route URL to handleSessionCallback(url:)
      - On cancel: set isLoading = false (not an error)
      - Retain session reference to keep it alive
   
   e) handleSessionCallback(url:):
      ROUTE BY url.host:
      
      case "oauth-callback":
        → parse ?code= → exchangeCodeForTokens(code:)
      
      case "await-verification":
        → isLoading = false
        → awaitingVerification = true
      
      case "await-password-reset":
        → isLoading = false
        → awaitingPasswordReset = true
      
      case "auth-redirect":
        → parse ?action= and ?reason= from query params
        → if action == "login" && reason == "account_exists":
            errorMessage = "You already have an account. Please log in."
            (LoginView shows this + auto-triggers startLogin after delay)
      
      default: break
   
   f) autoLoginWithToken(_ token: String):
      - POST /api/auth/auto-login { token, client_id, device_name, user_agent }
      - On success: save tokens to Keychain, set isAuthenticated = true
      - Cancel any lingering webAuthSession
      - On failure: set errorMessage, fall back to manual login
   
   g) exchangeCodeForTokens(code:):
      - POST /api/auth/oauth/token { grant_type, code, code_verifier, client_id, redirect_uri }
      - Save tokens to Keychain
      - Set isAuthenticated = true
   
   h) refreshToken():
      - POST /api/auth/oauth/token { grant_type: refresh_token, refresh_token, client_id }
      - Save new tokens
   
   i) logout():
      - POST /api/auth/oauth/revoke { token: refreshToken, client_id }
      - Clear Keychain
      - Set isAuthenticated = false, currentUser = nil
   
   j) checkAuthStatus():
      Called on init. Check Keychain for tokens, refresh if needed.

5. DEEP LINK MANAGER — Services/DeepLinkManager.swift:
   
   @MainActor class, ObservableObject, singleton.
   
   Published properties:
   - emailVerified: Bool
   - autoLoginToken: String?
   - pendingLocationId: Int?

   func handleURL(_ url: URL) -> Bool:
   
   Routes for fotolokashen:// scheme:
   
   case "email-verified":
     → extract ?token= query param
     → set autoLoginToken = token
     → set emailVerified = true
     → return true
   
   case "password-reset-complete":
     → post notification or set flag for LoginView
     → return true
   
   case "oauth-callback":
     → return false (handled by ASWebAuthenticationSession)
   
   case "location":
     → extract ID from path, set pendingLocationId
     → return true

6. LOGIN VIEW — Views/LoginView.swift:
   
   SwiftUI view displayed when !isAuthenticated.
   
   UI:
   - App logo
   - "Log In" button → authService.startLogin()
   - "Create Account" button → authService.startRegistration()
   - "Forgot Password?" button → authService.startForgotPassword()
   - Error message display (authService.errorMessage)
   - Loading indicator (authService.isLoading)
   
   State handling:
   - .onChange(of: deepLinkManager.emailVerified):
     if true AND autoLoginToken present → authService.autoLoginWithToken(token)
   
   - .onChange(of: authService.awaitingVerification):
     show native "Check Your Email" overlay/sheet
   
   - .onChange(of: authService.awaitingPasswordReset):
     show native "Check Your Email for Reset Link" overlay/sheet

7. APP ENTRY — Register URL handling in App struct:
   
   .onOpenURL { url in
       if !deepLinkManager.handleURL(url) {
           // Not a deep link — might be OAuth callback
           // ASWebAuthenticationSession handles this automatically
       }
   }
```

---

## Phase 6 — Apple App Site Association & Universal Links (Optional)

### Prompt for Agent

```
You are configuring Universal Links for [APP_NAME].

1. Create public/.well-known/apple-app-site-association:

{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["[TEAM_ID].[BUNDLE_ID]"],
        "paths": ["/shared/*", "/app/auth-callback"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["[TEAM_ID].[BUNDLE_ID]"]
  }
}

2. In the iOS project, add entitlements:
   - com.apple.developer.associated-domains:
     - applinks:[DOMAIN]
     - webcredentials:[DOMAIN]

3. Ensure the AASA file is served with Content-Type: application/json
   from https://[DOMAIN]/.well-known/apple-app-site-association

4. webcredentials enables Safari AutoFill integration —
   when users save passwords on the web, iOS will suggest them in-app.

Note: This phase is optional. The custom URL scheme ([URL_SCHEME]://)
works for all auth flows. Universal Links add security (domain-verified,
can't be hijacked by another app) and are Apple's preferred approach
for OAuth redirect URIs.
```

---

## Phase 7 — Testing Checklist

### Prompt for Agent

```
Test the following auth flows end-to-end. For each flow, verify both
the web (browser) and iOS (ASWebAuthenticationSession) paths.

WEB FLOWS:
□ Register with new email → verify email → login
□ Register with existing email → see "already registered" error
□ Login with correct credentials → authenticated
□ Login with wrong password → error message
□ Login with unverified email → "verify your email" + resend option
□ Forgot password → receive email → reset → login with new password
□ Session expiry → redirected to login

iOS FLOWS:
□ Create Account → panel opens → fill form → submit
  → panel closes → app shows "Check Your Email"
□ Create Account with existing email
  → panel briefly shows message → panel closes
  → app shows "Account exists" alert → offers login
□ Tap verification email link → Safari opens
  → auto-redirects (or button tap) → app opens
  → auto-login succeeds → authenticated (no manual login step)
□ Login → panel opens → enter credentials
  → panel closes → app is authenticated
□ Forgot Password → panel opens → enter email → submit
  → panel closes → app shows "Check your email"
□ Tap reset link in email → Safari opens → reset password
  → redirects to app → app shows "Password updated" → login
□ Logout → tokens cleared → login screen shown
□ Token refresh → expired access token → auto-refresh → still authenticated
□ Session invalidation → 401 from API → auto-logout

SECURITY:
□ Tokens stored as SHA-256 hashes in DB (not plaintext)
□ Rate limiting active on login, register, forgot-password
□ Auto-login token is single-use (cleared after first use)
□ Auto-login token expires after 5 minutes
□ PKCE code_verifier is validated on token exchange
□ Password reset invalidates all existing sessions
□ No PII in production console.log statements
```

---

## Common Pitfalls

| Pitfall | Solution |
|---|---|
| `ASWebAuthenticationSession` callback only fires once per session | The `handleSessionCallback` must route ALL `yourapp://` URLs, not just `oauth-callback` |
| Toast notifications invisible in Safari panel | Use `window.location.href` redirects for iOS, not toast/modal |
| User-Agent sniffing unreliable for platform detection | Pass `?source=ios` explicitly from the app |
| `hashToken()` must be called on BOTH store AND lookup | If you hash on store but look up raw, tokens will never match |
| Registration panel shows "Check Email" card | Redirect immediately for iOS; show card only for web |
| `prefersEphemeralWebBrowserSession = true` breaks "Remember Me" | Set to `false` to share cookies with Safari |
| `WKWebView` for auth will be rejected by Apple | Always use `ASWebAuthenticationSession` |
| In-memory rate limiting resets on serverless cold starts | Use Redis/Upstash for production; in-memory is dev-only |
