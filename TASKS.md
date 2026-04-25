# Fotolokashen — Open Tasks

> Tracked from [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) and [fotolokashen_comprehensive_review.md](./fotolokashen_comprehensive_review.md).  
> Last updated: April 25, 2026

---

## 🔴 Tier 1 — Security Risks

- [x] **Replace in-memory rate limiter with Upstash Redis** — Rewrote `rate-limit.ts` to use `@upstash/ratelimit` with sliding window in production; falls back to in-memory for local dev. All 5 callers updated to `await`. Env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. *(completed Apr 25, 2026)*
- [x] **Wrap location creation in `$transaction`** — `POST /api/locations` now wraps Location + UserSave + Photos in `prisma.$transaction()`. Partial failures auto-rollback. *(completed Apr 25, 2026)*
- [x] **Remove JWT fallback secret** — `auth.ts` now uses `process.env.JWT_SECRET!` with no fallback. Crashes loudly if env var is missing (validated by `env.ts` at startup). *(completed Apr 25, 2026)*
- [x] **Add `visibility` filter to `searchByLocation()`** — `search-utils.ts` now filters `visibility: { in: ['public', 'unlisted'] }` on the `savedLocations` query. Private saves are no longer exposed. *(completed Apr 25, 2026)*

---

## 🟡 Tier 2 — Should Fix Soon

- [ ] **Add Next.js `middleware.ts`** for server-side auth redirects — `src/middleware.ts` does not exist. Protected pages flash before client-side auth redirect kicks in. *(ref: Comprehensive Review §4)*
- [x] **Hash tokens before DB storage** — Already implemented: `verificationToken`, `resetToken`, and `autoLoginToken` all call `hashToken()` before writing to DB. Raw token only in email. *(verified Apr 25, 2026)*
- [ ] **Add `locationDetails` field to Prisma schema + API** — iOS `CreateLocationView` has a details field that is silently dropped on save. Needs schema migration + route update. *(ref: Security Review 2.3)*
- [x] **Gate tweakcn.com script with `NODE_ENV`** — `layout.tsx` now wraps the script in `process.env.NODE_ENV !== 'production'`. Never loads for real users. *(completed Apr 25, 2026)*
- [x] **Add pagination to `GET /api/locations`** — Replaced hardcoded `take:100` with cursor-based pagination (default 50, max 100). Returns `pagination.nextCursor` for clients to page forward. *(completed Apr 25, 2026)*
- [x] **Consolidate duplicate `Photo` type definitions** — `types/location.ts` now re-exports `Photo` from `types/photo.ts`. Single source of truth, `userId` is correctly `number | null`. *(completed Apr 25, 2026)*
- [x] **Type `verifyToken()` return** — Added `JWTPayload` interface in `auth.ts`. `verifyToken()` now returns `JWTPayload | null` instead of `any`. *(completed Apr 25, 2026)*

---

## 🟢 Tier 3 — Nice to Have

- [ ] **Add `@db.VarChar()` constraints to Prisma schema** — Text fields use unbounded `String` (Postgres `text`). Add column-level limits matching `VALIDATION_CONFIG`. *(ref: Security Review 6.1)*
- [ ] **iOS: Add `stripURLs()` helper** — Web sanitization now strips URLs, but iOS `CreateLocationView` and `EditProfileView` don't have an equivalent. *(ref: Security Review 5.1)*
- [ ] **iOS: Send only changed fields in preferences PATCH** — `ProfileUpdateRequest` serializes all fields even when only one changed. *(ref: Security Review 5.2)*
- [x] **Remove duplicate `queryClient.clear()`** — Removed second call in `auth-context.tsx`. *(completed Apr 25, 2026)*
- [ ] **Migrate `locations/route.ts` to `withAuth()` wrapper** — Currently uses manual `requireAuth()` pattern, inconsistent with other routes. *(ref: Comprehensive Review §2)*

---

*Check items off as they are addressed. Re-review recommended before public launch.*
