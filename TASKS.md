# Fotolokashen — Open Tasks

> Tracked from [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) and [fotolokashen_comprehensive_review.md](./fotolokashen_comprehensive_review.md).  
> Last updated: April 25, 2026

---

## 🔴 Tier 1 — Security Risks ✅

- [x] **Replace in-memory rate limiter with Upstash Redis** — Rewrote `rate-limit.ts` to use `@upstash/ratelimit` with sliding window in production; falls back to in-memory for local dev. All 5 callers updated to `await`. Env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. _(completed Apr 25, 2026)_
- [x] **Wrap location creation in `$transaction`** — `POST /api/locations` now wraps Location + UserSave + Photos in `prisma.$transaction()`. Partial failures auto-rollback. _(completed Apr 25, 2026)_
- [x] **Remove JWT fallback secret** — `auth.ts` now uses `process.env.JWT_SECRET!` with no fallback. Crashes loudly if env var is missing (validated by `env.ts` at startup). _(completed Apr 25, 2026)_
- [x] **Add `visibility` filter to `searchByLocation()`** — `search-utils.ts` now filters `visibility: { in: ['public', 'unlisted'] }` on the `savedLocations` query. Private saves are no longer exposed. _(completed Apr 25, 2026)_

---

## 🟡 Tier 2 — Should Fix Soon ✅

- [x] **Add Next.js `middleware.ts`** for server-side auth redirects — Merged auth logic into `src/proxy.ts` (Turbopack's middleware entrypoint). Reads `auth_token` cookie, lightweight-decodes JWT payload, redirects unauthenticated users to `/login?next=<path>` and logged-in users away from `/login`/`/register`. Auth flash eliminated. _(completed Apr 25, 2026)_
- [x] **Hash tokens before DB storage** — Already implemented: `verificationToken`, `resetToken`, and `autoLoginToken` all call `hashToken()` before writing to DB. Raw token only in email. _(verified Apr 25, 2026)_
- [x] **Add `locationDetails` field to Prisma schema + API** — `details` field was already in the schema and POST handler. Added it to PATCH `/api/locations/[id]` and the `Location` TypeScript interface. iOS `CreateLocationView` details now round-trip correctly. _(completed Apr 25, 2026)_
- [x] **Gate tweakcn.com script with `NODE_ENV`** — `layout.tsx` now wraps the script in `process.env.NODE_ENV !== 'production'`. Never loads for real users. _(completed Apr 25, 2026)_
- [x] **Add pagination to `GET /api/locations`** — Replaced hardcoded `take:100` with cursor-based pagination (default 50, max 100). Returns `pagination.nextCursor` for clients to page forward. _(completed Apr 25, 2026)_
- [x] **Consolidate duplicate `Photo` type definitions** — `types/location.ts` now re-exports `Photo` from `types/photo.ts`. Single source of truth, `userId` is correctly `number | null`. _(completed Apr 25, 2026)_
- [x] **Type `verifyToken()` return** — Added `JWTPayload` interface in `auth.ts`. `verifyToken()` now returns `JWTPayload | null` instead of `any`. _(completed Apr 25, 2026)_

---

## 🟢 Tier 3 — Nice to Have ✅

- [x] **Add `@db.VarChar()` constraints to Prisma schema** — Added `@db.VarChar()` to `User.email(254)`, `username(30)`, `firstName(50)`, `lastName(50)`, `bio(500)`, `Location.name(50)`, `address(250)`, `details(500)`. Limits match `VALIDATION_CONFIG`. Requires migration on deploy. _(completed Apr 25, 2026)_
- [x] **iOS: Add `stripURLs()` helper to EditProfileView** — Added `stripURLs()` to `EditProfileView.swift`, sanitizing firstName, lastName, bio, city, state, country before PATCH. Matches server-side `sanitizeUserInput()` behavior. _(completed Apr 25, 2026)_
- [x] **iOS: Send only changed fields in preferences PATCH** — `PreferencesView.swift` was sending all 10 profile fields even when only 3 changed. Now sends only `language`, `timezone`, `emailNotifications`. Prevents overwriting concurrent edits. _(completed Apr 25, 2026)_
- [x] **Remove duplicate `queryClient.clear()`** — Removed second call in `auth-context.tsx`. _(completed Apr 25, 2026)_
- [x] **Migrate `locations/route.ts` to `withAuth()` wrapper** — `GET /api/locations` now uses `withAuth()` (removes 8 lines of manual auth boilerplate). POST keeps manual `requireAuth()` due to rate limiting preceding auth. _(completed Apr 25, 2026)_

---

✅ **All tasks complete.** Re-review recommended before public launch.

### Pending deployment actions

- Run `prisma migrate dev --name varchar-constraints` to apply VarChar schema changes
- Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars
