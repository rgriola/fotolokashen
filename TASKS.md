# Fotolokashen — Open Tasks

> Tracked from [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) and [fotolokashen_comprehensive_review.md](./fotolokashen_comprehensive_review.md).  
> Last updated: April 25, 2026

---

## 🔴 Tier 1 — Security Risks

- [x] **Replace in-memory rate limiter with Upstash Redis** — Rewrote `rate-limit.ts` to use `@upstash/ratelimit` with sliding window in production; falls back to in-memory for local dev. All 5 callers updated to `await`. Env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. *(completed Apr 25, 2026)*
- [x] **Wrap location creation in `$transaction`** — `POST /api/locations` now wraps Location + UserSave + Photos in `prisma.$transaction()`. Partial failures auto-rollback. *(completed Apr 25, 2026)*
- [x] **Remove JWT fallback secret** — `auth.ts:6` now uses `process.env.JWT_SECRET!` with no fallback. Crashes loudly if env var is missing (validated by `env.ts` at startup). *(completed Apr 25, 2026)*
- [x] **Add `visibility` filter to `searchByLocation()`** — `search-utils.ts` now filters `visibility: { in: ['public', 'unlisted'] }` on the `savedLocations` query. Private saves are no longer exposed. *(completed Apr 25, 2026)*

---

## 🟡 Tier 2 — Should Fix Soon

- [ ] **Add Next.js `middleware.ts`** for server-side auth redirects — `src/middleware.ts` does not exist. Protected pages flash before client-side auth redirect kicks in. *(ref: Comprehensive Review §4)*
- [ ] **Hash tokens before DB storage** — `verificationToken`, `resetToken`, and `autoLoginToken` are stored in plaintext. Store SHA-256 hashes instead. *(ref: Security Review 6.2, 6.3)*
- [ ] **Add `locationDetails` field to Prisma schema + API** — iOS `CreateLocationView` has a details field that is silently dropped on save. Needs schema migration + route update. *(ref: Security Review 2.3)*
- [ ] **Gate tweakcn.com script with `NODE_ENV`** — `layout.tsx:107` loads `tweakcn.com/live-preview.min.js` for all users in production. Wrap in `process.env.NODE_ENV !== 'production'` check. *(ref: Comprehensive Review)*
- [ ] **Add pagination to `GET /api/locations`** — Currently hardcodes `take: 100`. Users with 100+ locations get silently truncated results. *(ref: Comprehensive Review)*
- [ ] **Consolidate duplicate `Photo` type definitions** — `types/location.ts` and `types/photo.ts` define `Photo` with conflicting field types (`userId: number` vs `number | null`). *(ref: Comprehensive Review §6)*
- [ ] **Type `verifyToken()` return** — `auth.ts:63` returns `any`. Create a `JWTPayload` interface and use it throughout the app. *(ref: Comprehensive Review §3)*
- [ ] **Add `visibility` filter to `searchByLocation()`** — Lines 296-298: commented intent, no implementation. Private saves are exposed. *(ref: Security Review)*

---

## 🟢 Tier 3 — Nice to Have

- [ ] **Add `@db.VarChar()` constraints to Prisma schema** — Text fields use unbounded `String` (Postgres `text`). Add column-level limits matching `VALIDATION_CONFIG`. *(ref: Security Review 6.1)*
- [ ] **iOS: Add `stripURLs()` helper** — Web sanitization now strips URLs, but iOS `CreateLocationView` and `EditProfileView` don't have an equivalent. *(ref: Security Review 5.1)*
- [ ] **iOS: Send only changed fields in preferences PATCH** — `ProfileUpdateRequest` serializes all fields even when only one changed. *(ref: Security Review 5.2)*
- [ ] **Remove duplicate `queryClient.clear()`** — Called twice in `auth-context.tsx:78-79`. *(ref: Comprehensive Review §3)*
- [ ] **Migrate `locations/route.ts` to `withAuth()` wrapper** — Currently uses manual `requireAuth()` pattern, inconsistent with other routes. *(ref: Comprehensive Review §2)*

---

*Check items off as they are addressed. Re-review recommended before public launch.*
