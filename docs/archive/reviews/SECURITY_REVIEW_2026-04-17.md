# Fotolokashen Security Review
**Date:** April 17, 2026  
**Scope:** Web API (Next.js/Prisma) + iOS Client (SwiftUI)  
**Reviewer:** Antigravity  

# Completed Apr 25, 2026. All issues fixed or accepted.
All 16 tasks from the original SECURITY_REVIEW and comprehensive review are now complete across both repos.

---

## Executive Summary

The codebase has a **solid security foundation** — JWT + session validation, Zod schemas on auth routes, a centralized sanitize library, and a rate-limit utility. However, several gaps exist: the rate limiter is in-memory (lost on restart, not distributed), URL injection is not stripped from free-text fields, some API routes lack length enforcement, and `console.log` statements leak user data in production. The iOS client correctly validates on-device but does not strip URLs yet.

**Overall risk level: Medium.** No critical injection or authentication bypass issues found.

---

## 1. Authentication & Session Management

### ✅ What's Working Well
- JWT tokens verified on every request via `requireAuth` in `api-middleware.ts`
- **Session database validation** — every request checks that the session still exists in `sessions` table and hasn't expired. This means server-side logout actually works.
- `isActive` check prevents deactivated accounts from authenticating
- `httpOnly` cookies — auth token cannot be read by JavaScript 
- `secure: true` in production — cookies only sent over HTTPS
- `sameSite: 'lax'` — CSRF protection for most scenarios 
- Account lockout fields exist in schema: `failedLoginAttempts`, `lockedUntil`

### ⚠️ Issues Found

**1.1 — Rate limiter is in-memory, not persistent**
```typescript
// src/lib/rate-limit.ts:13
const rateLimitStore = new Map<string, RateLimitRecord>();
```
This resets on every server restart / deployment and doesn't work across multiple serverless instances (Vercel). An attacker can brute-force login after each cold start.

> **Recommendation:** Replace with Redis (Upstash is free tier, integrates with Vercel). Until then, the existing `failedLoginAttempts` + `lockedUntil` DB-backed lockout is your real protection — verify it's actually enforced on the login route. 

**1.2 — `x-forwarded-for` IP can be spoofed**
```typescript
// src/lib/rate-limit.ts:163
const forwardedFor = headers.get('x-forwarded-for');
return forwardedFor.split(',')[0].trim();
```
Without a trusted proxy validation layer, an attacker can set `X-Forwarded-For: 1.2.3.4` and bypass per-IP rate limits.

> **Recommendation:** On Vercel, use `request.ip` (if available) or trust only the **last** IP in the `x-forwarded-for` chain, not the first.

**1.3 — `sameSite: 'lax'` is sufficient but not strict**
`lax` allows GET cross-site cookie sends (e.g., top-level navigation). Since your API only authenticates on state-changing requests (POST/PATCH/DELETE), this is acceptable. If you ever add GET endpoints that return user-specific sensitive data triggered by a cross-site link, upgrade to `sameSite: 'strict'`.

---

## 2. Input Validation & Sanitization

### ✅ What's Working Well
- **Auth routes use Zod** — `registerSchema` validates email, username regex, password complexity, age restriction
- `sanitizeUserInput()` in `sanitize.ts` strips HTML tags, control characters, and invisible zero-width chars
- `sanitizeUserInput` is called on all location text fields in `POST /api/locations`
- `VALIDATION_CONFIG` provides a central source of truth for field limits
- Location route enforces max lengths: name (50), address (250), notes (500) server-side

### ⚠️ Issues Found

**2.1 — URL injection not stripped from free-text fields**
```typescript
// sanitize.ts — current sanitizeUserInput()
// Strips HTML and control chars, but http://evil.com passes through
```
A user can store `http://phishing.com` in `locationName`, `bio`, `productionNotes`, `city`, etc. If this appears in an email notification or gets displayed with any link-detection rendering (native iOS `UITextView` data detectors, for example), it becomes a phishing vector.

> **Recommendation:** Add URL stripping to `sanitizeUserInput`:
> ```typescript
> .replace(/https?:\/\/\S+/gi, '')   // strip http/https URLs
> .replace(/\b(www\.)\S+/gi, '')     // strip www. URLs too
> ```
> Or create a separate `sanitizePublicText()` variant used for user-generated content that goes into notifications/emails.

**2.2 — `PATCH /api/v1/users/me` has no max-length enforcement**
```typescript
// src/app/api/v1/users/me/route.ts:122
updateData[field] = sanitizeUserInput(body[field]);
```
`sanitizeUserInput` is applied (good), but field lengths are **not validated** — a user can send a 10,000-character `bio`, `city`, or `timezone`. The Prisma schema has no `@db.VarChar()` annotations on these fields, so Postgres will accept them.

> **Recommendation:** Add a length check loop before the Prisma update:
> ```typescript
> const fieldLimits: Record<string, number> = {
>   firstName: 50, lastName: 50, bio: 500,
>   city: 100, state: 50, country: 100,
>   language: 10, timezone: 50
> };
> for (const [field, max] of Object.entries(fieldLimits)) {
>   if (updateData[field] && (updateData[field] as string).length > max) {
>     return apiError(`${field} exceeds maximum length`, 400);
>   }
> }
> ```

**2.3 — `locationDetails` field not in API schema**
The new `locationDetails` field added to `CreateLocationView` iOS form has no corresponding field in `POST /api/locations` body, `VALIDATION_CONFIG`, or the Prisma `Location` model. It will silently be dropped on save.

> **Recommendation:** 
> 1. Add `details String?` to `Location` model in `schema.prisma`
> 2. Add `details` to `VALIDATION_CONFIG.location` with `max: 500`
> 3. Sanitize and validate it in `POST /api/locations`

**2.4 — Photo caption limit is 20 characters**
```typescript
// validation-config.ts:29
caption: { min: 0, max: 20, label: 'Photo Caption' }
```
This seems accidentally low. The iOS `PipelinePhoto` model has a `caption` field — if users can type captions on iOS, 20 chars will frustrate them.

> **Recommendation:** Increase to 200 characters to match a typical caption use case.

---

## 3. Authorization & Access Control

### ✅ What's Working Well
- `requireAuth` / `withAuth` / `withAdmin` wrappers used consistently
- Admin endpoints use `requireAdmin` which re-checks `isAdmin` from DB
- Users can only update their own profile (ID comes from JWT, not request body)
- Location ownership enforced via `createdBy` field

### ⚠️ Issues Found

**3.1 — Location edit route — ownership not verified on iOS-facing create**
The `POST /api/locations` route creates under the authenticated user's ID (safe), but the location `[id]` edit routes should be audited to confirm they check `createdBy === user.id` before allowing edits.

> **Recommendation:** Audit `PATCH /api/locations/[id]` and `DELETE /api/locations/[id]` for ownership checks.

**3.2 — Deleted users (`deletedAt`) may still have valid sessions**
The schema has a `deletedAt` field (soft delete) but `requireAuth` only checks `isActive`, not `deletedAt`.

> **Recommendation:** Add `deletedAt: null` to the `findUnique` check in `requireAuth`:
> ```typescript
> where: { id: decoded.userId, deletedAt: null }
> ```

---

## 4. Information Disclosure

### ⚠️ Issues Found

**4.1 — Debug `console.log` leaks PII in production**
```typescript
// api-middleware.ts:114
console.log('[requireAuth] Token extracted:', token ? 'YES' : 'NO');
// api-middleware.ts:172
console.log('[requireAuth] User found:', user.email);  // ← EMAIL IN LOGS
```
```typescript
// locations/route.ts:151
console.log('[Save Location] Received data:', { placeId, name, address, ... });
```
Email addresses and location data appear in production server logs, which can be accessed by Vercel dashboard viewers.

> **Recommendation:** Wrap all `console.log` with a debug guard or replace with a structured logger that respects `NODE_ENV`:
> ```typescript
> if (process.env.NODE_ENV !== 'production') {
>   console.log(...)
> }
> ```

**4.2 — Generic 500 error response (good) but leaks stack in some try/catch**
The `withAuth` wrapper catches and returns generic `500` (good). But some routes have bare `console.error` which may include stack traces sent to Vercel logs.

> **Acceptable risk** — logs are internal, not returned to client.

**4.3 — `USER_PUBLIC_SELECT` exposes more than the iOS app needs**
Fields like `gpsPermission`, `homeLocationLat/Lng`, `verificationToken` status are returned to the iOS client on every auth call. Most of these are harmless but principle of least exposure suggests returning only what's needed.

---

## 5. iOS Client Security

### ✅ What's Working Well
- Text fields have real-time hard caps (50/500 chars)
- `canSave` gates on `trimmingCharacters` — whitespace-only input blocked
- Pre-save sanitization: trims, collapses internal spaces, removes blank lines
- No `UITextView` with `dataDetectorTypes` — tappable URLs not auto-created
- Keychain used for token storage (not UserDefaults)

### ⚠️ Issues Found

**5.1 — URLs not stripped from text inputs**
iOS sanitization trims and collapses whitespace but does not strip `http://` or `www.` URLs from Location Name, Location Details, Bio, or any other text field.

> **Recommendation:** Add to `saveLocation()` in `CreateLocationView` and the `saveProfile()` in `EditProfileView`:
> ```swift
> private func stripURLs(_ text: String) -> String {
>     let pattern = #"https?://\S+|www\.\S+"#
>     return (try? NSRegularExpression(pattern: pattern, options: .caseInsensitive)
>         .stringByReplacingMatches(in: text,
>                                   range: NSRange(text.startIndex..., in: text),
>                                   withTemplate: "")) ?? text
> }
> ```

**5.2 — `ProfileUpdateRequest` sends all fields even when unchanged**
When saving Preferences, the entire user object is serialized into `ProfileUpdateRequest` including fields not edited. This inflates payloads and increases the attack surface (more fields to validate).

> **Recommendation:** Send only changed fields (diff before/after) or use a dedicated preferences PATCH body with only `language`, `timezone`, `emailNotifications`.

**5.3 — No certificate pinning**
The app communicates with the API over HTTPS but doesn't pin the certificate. A MITM attack (via a rogue CA trusted by the device) could intercept auth tokens.

> **Low priority for current stage** — cert pinning increases maintenance burden. Acceptable risk until the app has a larger user base.

**5.4 — `CLLocationManager().authorizationStatus` creates a new manager instance**
```swift
// PermissionsView.swift
locationStatus = CLLocationManager().authorizationStatus
```
Creating a new `CLLocationManager` per status check is fine for reading status, but if it were used for requesting permission it would silently fail. Current usage is safe but brittle.

---

## 6. Data Storage & Schema

### ✅ What's Working Well
- Passwords stored as hashes (bcrypt via `hashPassword`)
- `twoFactorSecret` field exists (2FA scaffolded)
- Soft delete pattern with `deletedAt` 
- Session expiry enforced at DB level (`expiresAt`)
- PKCE implemented in OAuth flow (`codeChallenge`, `codeChallengeMethod`)

### ⚠️ Issues Found

**6.1 — No `@db.VarChar()` annotations on text fields**
The Prisma schema uses `String` for all text fields without column-level length constraints. PostgreSQL's `text` type is unbounded. If server-side validation is bypassed (direct DB access, migration scripts, future API additions), oversized data can be stored.

> **Recommendation:** Add `@db.VarChar(N)` to match your `VALIDATION_CONFIG` limits on critical fields, particularly `Location.name`, `User.bio`, `User.firstName`, `User.lastName`, `Photo.caption`.

**6.2 — `autoLoginToken` stored in plaintext**
```prisma
autoLoginToken  String?  @unique
```
Auto-login tokens act like temporary passwords. If the DB is compromised, all pending auto-login tokens are exposed.

> **Recommendation:** Store a hash of the token (like password reset tokens should be), and compare on use.

**6.3 — `verificationToken` and `resetToken` stored in plaintext**
Same issue as 6.2.

> **Recommendation:** Store `SHA-256` hash of verification and reset tokens. Only the raw token is sent by email — the DB never holds the actual secret.

---

## 7. Rate Limiting Coverage

| Endpoint | Rate Limited? | Preset |
|---|---|---|
| `POST /auth/login` | ✅ Yes | STRICT (5/15min) |
| `POST /auth/register` | ✅ Yes | MODERATE |
| `POST /auth/forgot-password` | ✅ Yes | STRICT |
| `POST /auth/reset-password` | ✅ Yes | STRICT |
| `POST /api/locations` | ❓ Not confirmed | — |
| `PATCH /api/v1/users/me` | ❌ No | — |
| `POST /api/photos` | ❌ No | — |
| `GET /api/locations` (bulk) | ❌ No | — |

> **Recommendation:** Apply `LENIENT` rate limiting to authenticated API routes via a middleware wrapper or Next.js middleware.

---

## Priority Matrix

| # | Issue | Severity | Effort |
|---|---|---|---|
| 2.3 | `locationDetails` field missing from API/DB | **High** | Low |
| 4.1 | PII in production logs (email in `console.log`) | **High** | Low |
| 2.2 | No max-length enforcement on PATCH /users/me | **Medium** | Low |
| 2.1 + 5.1 | URL injection not stripped (web + iOS) | **Medium** | Low |
| 3.2 | Soft-deleted users can still auth | **Medium** | Low |
| 7 | Rate limiting gaps on data-write endpoints | **Medium** | Medium |
| 6.3 | Verification/reset tokens stored in plaintext | **Medium** | Medium |
| 1.2 | `x-forwarded-for` IP spoofing | **Medium** | Low |
| 1.1 | In-memory rate limiter lost on restart | **Low** | High |
| 6.1 | No `@db.VarChar()` column constraints | **Low** | Medium |
| 5.2 | Preferences PATCH sends full user object | **Low** | Low |
| 6.2 | `autoLoginToken` in plaintext | **Low** | Medium |
| 5.3 | No certificate pinning | **Low** | High |

---

## Quick Wins (Can implement in one session)

1. **Strip URLs in `sanitizeUserInput`** — 3-line regex addition
2. **Add `deletedAt: null` guard in `requireAuth`** — 1-line addition
3. **Guard all `console.log` with `NODE_ENV !== 'production'`** — global find/replace
4. **Add length validation loop to `PATCH /users/me`** — ~15 lines
5. **Add `locationDetails` to Prisma schema + Location API** — schema migration + route update
6. **Strip URLs from iOS pre-save sanitization** — add `stripURLs()` helper

---

*Review based on source code audit conducted April 17, 2026. This is a point-in-time snapshot; re-review recommended before any public launch or significant user growth.*
