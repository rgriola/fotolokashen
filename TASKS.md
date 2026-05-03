# Fotolokashen — Active Tasks

> Tracked from [docs/archive/reviews/SECURITY_REVIEW_2026-04-17.md](./docs/archive/reviews/SECURITY_REVIEW_2026-04-17.md) and [docs/archive/reviews/fotolokashen_comprehensive_review_2026-04-15.md](./docs/archive/reviews/fotolokashen_comprehensive_review_2026-04-15.md).  
> Last updated: 2026-05-03 13:42 EDT  
> Test status: ✅ `npm run test` passed (51/51 tests on 2026-05-03)

---

## 🔥 Active Priorities (Top)

### P0 — Session Management Hardening

- [ ] Validate unusual IP change behavior in active sessions
- [ ] Limit active sessions per account (target: 2-3)
- [ ] Auto-expire oldest session when the cap is exceeded
- [ ] Add user-facing Active Sessions management UI

### P1 — Email Verification UX Completion

- [ ] Add visual token-expiry timer on verify/resend flows
- [ ] Add resend flow with email re-entry + captcha
- [ ] Ensure resend rotates token and invalidates prior token

### P1 — Performance, Quality, and Reliability

- [ ] Optimize key database query patterns and indexes
- [ ] Add targeted caching for high-read endpoints
- [ ] Continue Core Web Vitals regression tracking
- [ ] Expand automated test coverage
- [ ] Add E2E tests for critical user flows

### P2 — Product and Workflow Enhancements

- [ ] Add social interaction notifications
- [ ] Add location collections/albums
- [ ] Expand AI features (auto-tagging and semantic search)
- [ ] Add in-app help documentation system

### P2 — Documentation and Prompt Workflow

- [ ] Move remaining agent prompt plans from repo root to prompts folder when finalized
- [ ] Keep root docs minimal: operational docs + selected active agent guides only

---

## ✅ Recently Completed (Highlights)

- [x] Mobile API v1 contract hardening + strict schema tests for iOS compatibility (2026-04-30)
- [x] Location Group API and schema foundation for event grouping (2026-04-27)
- [x] OAuth/session reliability fixes (web+iOS) including stale-cookie 401 loop fixes (2026-04-27)
- [x] Legal content moved to markdown-backed architecture (2026-04-27)
- [x] Security Review Tiers 1-3 completed (2026-04-25)

---

## 🚀 Pre-Release Ops Checklist

- [ ] Run `prisma migrate dev --name varchar-constraints` to apply VarChar schema changes
- [ ] Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel
- [ ] Run `npm run lint` and address any new issues before release
- [ ] Re-run `npm run test` before each production deployment
