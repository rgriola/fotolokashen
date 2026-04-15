# Authentication & Registration Flow

> Cross-platform authentication flow for fotolokashen — web and iOS.

## Overview

Fotolokashen uses an **OAuth 2.0 PKCE** flow for iOS authentication and standard **cookie-based sessions** for web users. Both platforms share the same backend API and registration UI (rendered as web pages), but the email verification redirect behaves differently depending on the originating platform.

---

## Web Registration Flow

```
User → /register → fills form → POST /api/auth/register
  → User created (emailVerified: false)
  → Verification email sent (link: /verify-email?token=xxx)
  → "Check Your Email" card shown
  → User clicks email link → /verify-email?token=xxx
  → Email verified → "Go to Login" button → /login
  → User logs in → cookie set → authenticated
```

### Key files

| File | Role |
|------|------|
| `src/app/register/page.tsx` | Register page layout, logo hiding on mobile |
| `src/components/auth/RegisterForm.tsx` | Form with success state ("Check Your Email" card) |
| `src/app/api/auth/register/route.ts` | Creates user, sends verification email, creates session |
| `src/lib/email.ts` → `sendVerificationEmail()` | Builds verification URL, sends via Resend |
| `src/app/verify-email/page.tsx` | Verifies token, shows success/error UI |
| `src/app/api/auth/verify-email/route.ts` | Verifies token in DB, sends welcome email |

---

## iOS Registration Flow

The iOS app uses `ASWebAuthenticationSession` to open the web registration form in a system browser sheet. The critical difference is the **email verification redirect** — after verifying, the user must be sent back to the iOS app, not left in Safari.

```
┌──────────────────────────────────────────────────────────┐
│ iOS App                                                  │
│                                                          │
│  1. User taps "Create Account"                           │
│  2. AuthService.startRegistration()                      │
│  3. ASWebAuthenticationSession opens:                    │
│     fotolokashen.com/register?client_id=...              │
│     &redirect_uri=fotolokashen://oauth-callback          │
│     &code_challenge=...&response_type=code               │
│  4. User fills web form → submits                        │
│  5. RegisterForm shows "Check Your Email" card           │
│  6. User manually dismisses the browser                  │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ Backend (POST /api/auth/register)                        │
│                                                          │
│  • Detects iOS via User-Agent (iPhone/iPad)              │
│  • Sets deviceType = 'mobile-browser-ios'                │
│  • Passes platform='ios' to sendVerificationEmail()      │
│  • Verification URL includes &platform=ios:              │
│    https://fotolokashen.com/verify-email?token=xxx       │
│    &platform=ios                                         │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ Email (Mail.app / Gmail)                                 │
│                                                          │
│  User taps verification link → opens in Safari           │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ Web: /verify-email?token=xxx&platform=ios                │
│                                                          │
│  • Calls GET /api/auth/verify-email?token=xxx            │
│  • Email verified successfully                           │
│  • Detects platform=ios in URL                           │
│  • Auto-redirects to: fotolokashen://email-verified      │
│  • Shows "Open fotolokashen App" button as fallback      │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│ iOS App (Deep Link)                                      │
│                                                          │
│  • fotolokashen://email-verified received                │
│  • DeepLinkManager.handleURL() sets emailVerified = true │
│  • LoginView observes the flag via .onChange              │
│  • Auto-calls AuthService.startLogin() after 0.5s delay  │
│  • ASWebAuthenticationSession opens login page           │
│  • User logs in → OAuth code → token exchange → done     │
└──────────────────────────────────────────────────────────┘
```

### Key files (iOS)

| File | Role |
|------|------|
| `AuthService.swift` | `startRegistration()` opens web form, `startLogin()` opens login |
| `DeepLinkManager.swift` | Handles `fotolokashen://email-verified`, sets `emailVerified` flag |
| `ContentView.swift` → `LoginView` | Observes `emailVerified`, auto-triggers `startLogin()` |
| `Info.plist` | Registers `fotolokashen` custom URL scheme |

---

## Deep Link Scheme

| URL | Handler | Purpose |
|-----|---------|---------|
| `fotolokashen://oauth-callback?code=xxx` | `AuthService.handleCallback()` | OAuth code exchange after login |
| `fotolokashen://email-verified` | `DeepLinkManager` → `LoginView` | Return user to app after email verification |
| `fotolokashen://location/{id}` | `DeepLinkManager.navigateToLocation()` | Open a specific location |

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

// Pass to email builder
const platform = deviceType === 'mobile-browser-ios' ? 'ios' : undefined;
await sendVerificationEmail(email, verificationToken, username, platform);
```

The `platform` parameter is appended to the verification URL:
```
// platform=ios → adds &platform=ios to the link
const platformParam = platform ? `&platform=${platform}` : '';
const verificationUrl = `${APP_URL}/verify-email?token=${token}${platformParam}`;
```

---

## Username Handling

- **Live enforcement**: The `RegisterForm` username input forces lowercase and strips trailing whitespace as the user types via an `onChange` handler
- **Schema backup**: The Zod schema applies `.toLowerCase().trim()` on submit as a safety net
- **Regex**: Only `[a-zA-Z0-9_-]` characters allowed (min 3, max 50)

---

## Date of Birth Picker

- **Component**: `DateOfBirthPicker.tsx` using `ScrollWheelPicker.tsx`
- **UI**: Three scroll-wheel pickers (Month / Day / Year) with centered highlight band
- **Default**: Intentionally blank — never pre-selects today's date
- **Year range**: 18–100 years ago (enforces minimum age at the UI level)
- **Output**: ISO `YYYY-MM-DD` string to the backend
- **Validation**: Zod schema double-checks age ≥ 18 on submit

---

## Mobile Auth UI

On mobile viewports (< 640px / `sm` breakpoint):

- **Header**: Hidden on all auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) via `hidden sm:block` class in `Header.tsx`
- **Logo**: Hidden above the auth card via `hidden sm:flex`
- **Spacing**: Compact — `space-y-3`, `h-9` inputs, `text-xs` labels
- **Card**: Full-width, vertically centered with `py-4` padding

This prevents the header from overlapping the form in iOS WebView and reduces scrolling.
