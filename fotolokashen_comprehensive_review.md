# Fotolokashen Web App — Comprehensive Code Review

> **Codebase Stats:** ~285 source files, ~47,000 LOC (TypeScript/TSX)  
> **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Prisma 6 · PostgreSQL · ImageKit CDN · Google Maps API  
> **Reviewed:** April 15, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Coding Architecture Review](#coding-architecture-review)
3. [CSS & Styling Architecture Review](#css--styling-architecture-review)
4. [Business Logic Gaps (File-by-File)](#business-logic-gaps-file-by-file)
5. [What Works Well](#what-works-well)
6. [What Needs Improvement](#what-needs-improvement)
7. [Recommendations to Strengthen the App](#recommendations-to-strengthen-the-app)
8. [Dynamic Feature Readiness Roadmap](#dynamic-feature-readiness-roadmap)

---

## Executive Summary

Fotolokashen is a well-structured Next.js 16 application with a solid foundation in authentication, security, and Google Maps integration. The codebase shows thoughtful engineering in areas like input sanitization, rate limiting, and a clean permissions system. However, several architectural decisions will become bottlenecks as the app grows: the **map page is a 800-line monolith**, **type definitions are duplicated** across files, **API routes lack consistent use of the `withAuth` wrapper**, **the Projects feature has schema but no implementation**, and the **in-memory rate limiter won't survive serverless deployments**. Below is a full breakdown.

---

## Coding Architecture Review

### 1. Project Structure — ✅ Good Foundation

```
src/
├── app/           # Pages & API routes (App Router)
├── components/    # UI, layout, feature components
├── config/        # Icon config
├── hooks/         # 12 custom hooks
├── lib/           # 35 utility modules
└── types/         # 6 type definition files
```

**What works:**
- Clear separation between `app/`, `components/`, `hooks/`, `lib/`, `types/`
- Custom hooks extract reusable logic from pages (`useMapMarkers`, `useGpsHandlers`, etc.)
- The `lib/` folder is well-organized with focused utility modules

**What needs improvement:**
- `src/config/` has only `icons.ts` — consider consolidating into `lib/constants/`
- No `middleware.ts` at the root — all auth is done per-route (see Auth section)
- Missing a `services/` layer between API routes and Prisma queries
- No `lib/errors/` for custom error classes or error boundaries

---

### 2. API Architecture — ⚠️ Mixed Patterns

#### Good: Route Handler Wrappers ([api-middleware.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/api-middleware.ts))

The `withAuth()`, `withOptionalAuth()`, and `withAdmin()` higher-order wrappers are excellent — they eliminate repetitive auth + try/catch boilerplate:

```typescript
// Clean pattern (used in some routes)
export const GET = withAuth(async (request, user) => {
    const data = await doSomething(user.id);
    return apiResponse(data);
});
```

#### Problem: Inconsistent Usage

The main [locations/route.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/api/locations/route.ts) (342 lines) does NOT use `withAuth()` — it manually calls `requireAuth()` with its own try/catch. This creates two patterns:

```typescript
// locations/route.ts — manual pattern (INCONSISTENT)
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401);
        }
        // ... 80+ lines of business logic ...
    } catch (error) {
        return apiError('Failed to fetch locations', 500);
    }
}
```

> [!IMPORTANT]
> **Recommendation:** Migrate ALL API routes to use `withAuth()` / `withAdmin()` wrappers. This will cut ~15 lines of boilerplate from each route and ensure consistent error handling.

---

### 3. Authentication System — ✅ Strong, with Caveats

#### [auth.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/auth.ts)

**Strengths:**
- JWT + bcrypt with proper salt rounds (10)
- "Remember me" support (7d vs 30d expiry)
- Verification and reset tokens via `crypto.randomBytes(32)`

**Concerns:**

```typescript
// Line 6 — SECURITY: Fallback secret in production is dangerous
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
```

> [!CAUTION]
> The fallback `'fallback-secret-for-development'` could silently activate in production if the env var is missing. The `env.ts` validates `JWT_SECRET` at startup, but `auth.ts` has its own fallback that bypasses this.  
> **Fix:** Remove the fallback. Let it crash loudly if `JWT_SECRET` is missing.

```typescript
// Line 63 — verifyToken returns `any`
export function verifyToken(token: string): any | null {
```

> [!WARNING]
> The `any` return type means token payloads are untyped throughout the app. Create a `JWTPayload` interface.

#### [auth-context.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/auth-context.tsx)

**Issue — Duplicate `queryClient.clear()` on line 78-79:**
```typescript
queryClient.clear(); // Clear all cached data
queryClient.clear(); // Clear all cached data ← DUPLICATE
```

**Issue — `staleTime: 0` + `gcTime: 0`:** These settings mean the auth check fires on EVERY component mount and never caches. This creates excessive API calls. Consider `staleTime: 30_000` (30s) as a compromise.

---

### 4. Middleware Gap — ❌ Missing Next.js Middleware

There is no `middleware.ts` file at the project root. All route protection happens at the page level via `<ProtectedRoute>` component and at the API level via `requireAuth()`. This means:

- Every protected page requires wrapping in `<ProtectedRoute>` (easy to forget)
- No server-side redirect for unauthenticated users visiting `/map`, `/locations`, etc.
- The full page loads client-side before the auth check kicks in

> [!IMPORTANT]
> **Recommendation:** Add a `middleware.ts` that checks the `auth_token` cookie and redirects unauthenticated users before the page renders. This improves security AND perceived performance.

---

### 5. Database Layer (Prisma) — ✅ Well-Designed Schema

#### [schema.prisma](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/prisma/schema.prisma) (583 lines)

**Strengths:**
- Proper indexing on frequently-queried fields
- Soft deletes via `deletedAt` on User
- OAuth (PKCE) support for iOS app
- Full email template versioning system
- Cascade deletes configured correctly on all relations

**Concerns:**

1. **`User.role` is a raw string instead of an enum:**
   ```prisma
   role String @default("user") // user, staffer, super_admin
   ```
   This should be a Prisma enum for type safety and database-level validation.

2. **No database-level constraint on `UserSave.visibility`:**
   ```prisma
   visibility String @default("private") // 'public', 'unlisted', 'private'
   ```
   App-level validation exists, but a database `CHECK` constraint or enum would prevent invalid data.

3. **`Photo` has BOTH `locationId` and `placeId`:**  
   `placeId` (Google's ID) is stored on Photo separately from the Location it belongs to. This creates a potential sync issue — if the Location's `placeId` changes, the Photo's won't.

4. **No index on `UserFollow.createdAt`:**  
   Queries like "recent followers" will table-scan without it.

---

### 6. Type Safety — ⚠️ Duplicate Definitions

The `Photo` interface is defined in TWO files with different shapes:

| Field | [types/location.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/types/location.ts) (L3-30) | [types/photo.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/types/photo.ts) (L1-23) |
|---|---|---|
| `userId` | `number` (required) | `number \| null` |
| GPS fields | included (optional) | not included |
| `originalFilename` | `string` | `string \| null` |

> [!WARNING]
> **This is a latent bug.** Components importing `Photo` from `types/location` will have different type expectations than those importing from `types/photo`. Consolidate into a single canonical `Photo` type.

Similarly, `types/photo.ts` has `PhotoMetadata` and `lib/photo-utils.ts` also defines `PhotoMetadata` — two separate interfaces for the same concept.

---

### 7. State Management — ⚠️ Map Page Complexity

#### [map/page.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/map/page.tsx) (803 lines)

The map page has **15+ useState calls** and manages:
- Save panel, details panel, locations panel, public details panel, friends dialog, share dialog, search dialog
- GPS state, markers, public locations, bounds
- Onboarding state

Despite good hook extraction (`useMapMarkers`, `useGpsHandlers`, `useMapNavigation`), the orchestrator still owns too much state. The `LocationDetailPanel` prop construction (lines 541-606) is a **65-line object literal** mapping properties one-by-one.

> [!IMPORTANT]
> **Recommendation:** Consider a reducer pattern or Zustand store for map page state. Create a `LocationDetailProps` builder function to eliminate the manual prop mapping.

---

### 8. Rate Limiting — ❌ In-Memory Won't Work on Vercel

#### [rate-limit.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/rate-limit.ts)

```typescript
// In-memory store for rate limiting
// In production, use Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitRecord>();
```

The comment acknowledges the issue — this `Map` is per-process and per-invocation on Vercel's serverless. Each cold start gets a fresh `Map`. Rate limiting is effectively **non-functional in production**.

> [!CAUTION]
> **This is a security vulnerability.** Brute-force protection on login, password reset, and registration endpoints is not working in production.  
> **Fix:** Use Vercel KV (Redis), Upstash, or the database for rate limit counters.

---

### 9. Error Handling — ⚠️ Inconsistent Patterns

- API routes: Some use `withAuth()` automatic error handling, others have manual try/catch
- Console logging is mixed: `console.log`, `console.error`, `console.warn` with no structured logging
- The `requireAuth` function has 6 `console.log` calls (lines 105-163) — these should be removed or behind a debug flag in production

> [!WARNING]
> **Excessive auth logging in production:**  
> Lines like `console.log('[requireAuth] User found:', user.email)` log PII (email addresses) to server logs on every authenticated request. Remove or mask these.

---

### 10. Testing — ❌ Minimal Coverage

Only **3 test files** exist:
- `parseBoundsFilter.test.ts`
- `apiHelpers.test.ts`
- `uploadValidation.test.ts`

For 47,000 LOC and ~285 files, this is critically low. No component tests, no integration tests, no E2E tests.

---

## CSS & Styling Architecture Review

### 1. Design System — ✅ Modern & Well-Structured

#### [globals.css](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/globals.css) (176 lines)

**Strengths:**
- Uses **oklch()** color space — cutting-edge for perceptual uniformity
- Full dark mode support via `.dark` class
- Custom semantic tokens: `--success`, `--warning`, `--info`, `--social`, `--destructive`
- Sensible radius scale from `--radius-sm` to `--radius-4xl`
- Base typography reset on `h1-h4`, `p`, `small`

**Concerns:**

1. **No spacing scale defined:** The design system has colors and radii but no standardized spacing tokens. All spacing is ad-hoc Tailwind values (`px-4`, `py-3`, `gap-6`) with no systematic 4px/8px grid.

2. **No max-width / line-length constraint:** Text blocks can stretch full-width on large screens. Previous conversation (6cf3efe5) addressed this but it's not reflected in `globals.css`.

3. **Font choice:** Using `Geist` and `Geist_Mono` (good, modern fonts) but the Tailwind `@theme` maps to `--font-geist-sans` / `--font-geist-mono`. No fallback stack is explicit.

4. **`userScalable: false` in viewport config** (layout.tsx:30):
   ```typescript
   userScalable: false,
   ```
   > [!WARNING]  
   > This is an **accessibility violation** (WCAG 1.4.4). Users who need to zoom for readability are blocked. Remove this unless there's a specific iOS webview reason.

---

### 2. Component Library (shadcn/ui) — ✅ Good Choice

28 UI components in `components/ui/` including:
- Radix primitives: Dialog, Select, Dropdown, Tabs, Tooltip, Switch, Slider, Alert Dialog
- Custom components: `HoldToVerify`, `ImageKitUploader`, `PhotoCarouselManager`, `PhotoLightbox`

**Strengths:**
- Consistent use of `class-variance-authority` for component variants
- `tailwind-merge` prevents className conflicts
- `sonner` for toast notifications (top-center positioning)

**Concerns:**

1. **No typography component:** Text styles are applied via global CSS base styles (`h1`, `h2`, etc.) and inline Tailwind. A `<Typography variant="h1">` component would be more maintainable.

2. **Inline style overrides scattered through pages:** Many components have long `className` strings with one-off adjustments:
   ```tsx
   // map/page.tsx L394 — 4-line className string
   className={`
       fixed top-20 z-10
       bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg
       transition-all duration-300 ease-in-out
       ${rightPanelOpen ? 'right-[calc(50%+14rem)]' : 'right-56'}
   `}
   ```
   These should be extracted into component CSS or variant classes.

3. **Backup file in components:** `HomeLocationMapPicker.tsx.bak` exists in `components/maps/` — should be deleted.

---

### 3. Layout Architecture — ⚠️ Rigid for Growth

#### Layout Components:
- `Header.tsx` — clean, simple (49 lines)
- `Navigation.tsx` — desktop nav links
- `AuthButton.tsx` — login/avatar button
- `MobileMenu.tsx` — sheet-based mobile nav
- `Footer.tsx` — conditional display
- `LayoutWrapper.tsx` — minimal container

**Issues:**

1. **Fixed layout math:** The map page uses `fixed inset-0 top-16` assuming the header is exactly 64px. If the header height changes, the map breaks.

2. **`ConditionalFooter` approach:** The footer is hidden per-route via a component that checks `usePathname()`. A layout group (`(with-footer)/`) would be more idiomatic for App Router.

3. **No responsive breakpoint consistency:** Some components use `md:`, others use `sm:`, others use `lg:` without a clear system. The map controls switch behavior at `1024px` (`window.innerWidth >= 1024`) via JavaScript, while CSS uses Tailwind breakpoints.

---

## Business Logic Gaps (File-by-File)

### Core Business Logic

| File | Gap | Severity |
|------|-----|----------|
| [api/locations/route.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/api/locations/route.ts) | No pagination on GET — `take: 100` hardcoded. Users with 100+ locations get truncated results silently | 🔴 High |
| [api/locations/route.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/api/locations/route.ts) | N+1 query pattern: fetches photos per-location in a loop (`Promise.all` with individual queries) | 🟡 Medium |
| [api/locations/route.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/api/locations/route.ts) | POST creates Location + UserSave + Photos in separate queries without a transaction — partial failure leaves orphaned records | 🔴 High |
| [auth.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/auth.ts) | `verifyToken()` returns `any` — JWT payload is untyped | 🟡 Medium |
| [auth.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/auth.ts) | JWT payload includes `avatar` and `bannerImage` URLs — these become stale if user changes their avatar | 🟡 Medium |
| [auth-context.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/auth-context.tsx) | Duplicate `queryClient.clear()` call (L78-79) | 🟢 Low |
| [rate-limit.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/rate-limit.ts) | In-memory Map resets on every serverless cold start — rate limiting is non-functional on Vercel | 🔴 High |
| [permissions.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/permissions.ts) | Team/Project permission functions exist but are never imported or used anywhere in the codebase | 🟡 Medium |
| [security.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/security.ts) | `getFailedLoginAttempts()` loads ALL failed login events then filters in JavaScript — should be a database query | 🟡 Medium |
| [search-utils.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/search-utils.ts) | `searchByBio()` doesn't filter out current user — you can find yourself in results | 🟢 Low |
| [search-utils.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/search-utils.ts) | `searchByLocation()` comment says to filter by visibility but the `where` clause doesn't actually filter `visibility` field | 🔴 High |
| [photo-utils.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/photo-utils.ts) | 30+ `console.log` debug statements left in production code | 🟡 Medium |
| [sanitize.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/sanitize.ts) | `sanitizeHTML()` is supposed to allow safe HTML but actually strips all tags (same as `sanitizeText`) | 🟡 Medium |
| [imagekit.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/lib/imagekit.ts) | Hardcoded CDN URL fallback `'https://ik.imagekit.io/rgriola'` — should come from env | 🟢 Low |

### Pages & Components

| File | Gap | Severity |
|------|-----|----------|
| [page.tsx (home)](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/page.tsx) | Landing page is `"use client"` — blocks SEO since the entire page is client-rendered including meta content | 🟡 Medium |
| [page.tsx (home)](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/page.tsx) | Features section has a bizarre `-mt-[calc(100vh-25px)]` that pulls content up over the hero — brittle layout math | 🟡 Medium |
| [map/page.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/map/page.tsx) | 15+ useState calls, 65-line prop literals, 800 lines total — needs decomposition | 🟡 Medium |
| [map/page.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/map/page.tsx) | Onboarding status is fetched via separate API call instead of being included in the auth context | 🟡 Medium |
| [locations/page.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/locations/page.tsx) | Client-side filtering instead of server-side — loads ALL locations then filters in browser | 🟡 Medium |
| [locations/page.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/locations/page.tsx) | `confirm("Are you sure...")` for delete — should use the Radix AlertDialog from the UI library | 🟢 Low |
| [projects/page.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/projects/page.tsx) | Entire page is a "Coming Soon" placeholder despite having full Prisma schema (Project, ProjectLocation, ProjectMember, LocationContact) | 🟡 Medium |
| [not-found.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/not-found.tsx) | Both buttons ("Go Home" and "Return Home") link to the same page ("/") | 🟢 Low |
| [layout.tsx](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/app/layout.tsx) | Loads tweakcn.com live preview script in production (line 110) — should be development only | 🟡 Medium |

### Hooks

| File | Gap | Severity |
|------|-----|----------|
| [usePhotoCacheManager.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/hooks/usePhotoCacheManager.ts) | 20+ debug `console.log` calls left in production | 🟡 Medium |
| [usePhotoCacheManager.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/hooks/usePhotoCacheManager.ts) | `uploadAllToImageKit()` stops on first error — no partial success handling. If photo 3/5 fails, photos 4 and 5 are never attempted | 🟡 Medium |
| [usePhotoCacheManager.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/hooks/usePhotoCacheManager.ts) | `user` is imported from auth context but never used | 🟢 Low |

### Types

| File | Gap | Severity |
|------|-----|----------|
| [types/location.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/types/location.ts) + [types/photo.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/types/photo.ts) | Duplicate `Photo` interface with conflicting field types | 🔴 High |
| [types/user.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/types/user.ts) | `role` is `string` instead of a typed union `'user' \| 'staffer' \| 'super_admin'` | 🟡 Medium |
| [types/photo.ts](file:///Users/rodczaro/Desktop/00-Vibecode/fotolokashen/src/types/photo.ts) | `PhotoMetadata` also defined in `lib/photo-utils.ts` — two versions | 🟡 Medium |

---

## What Works Well

### ✅ Security Posture
- **CSP headers** properly configured with nonce-less approach
- **HSTS** enabled in production with preload
- **Input sanitization** applied systematically on all user inputs
- **Session validation** checks both JWT validity AND database session existence
- **Virus scanning** integration (ClamAV) for photo uploads
- **Account lockout** after failed login attempts (schema supports it)
- **Security logging** with IP, user agent, and event tracking
- **PKCE OAuth flow** for iOS app authentication

### ✅ API Design
- `withAuth()` / `withAdmin()` wrappers are DRY and well-designed
- Consistent `apiResponse()` / `apiError()` formatting
- `USER_PUBLIC_SELECT` / `USER_SUMMARY_SELECT` prevent data leakage
- `parseBoundsFilter()` supports both JSON and CSV formats

### ✅ Design System
- oklch color space is forward-thinking
- Full light/dark mode token parity
- Semantic color tokens (`success`, `warning`, `info`, `social`, `destructive`)
- Radix UI primitives provide accessible component foundations

### ✅ Code Organization
- Clean hook extraction from complex pages
- Validation config centralized in one file
- Constants centralized (`messages.ts`, `upload.ts`)
- Environment validation at startup with clear error messages

### ✅ Photo Pipeline
- EXIF extraction with comprehensive metadata capture
- HEIC/TIFF → JPEG client-side conversion before upload
- Server-side virus scanning + compression
- ImageKit CDN with proper folder separation (dev/prod)

### ✅ Prisma Schema
- Well-indexed with composite and single-field indexes
- Proper cascade deletes on all foreign keys
- Soft delete support on User
- OAuth token tracking with device metadata

---

## What Needs Improvement

### 🔴 Critical

1. **Rate limiting is non-functional in production** — In-memory `Map` resets on serverless cold starts
2. **No database transactions** — Location creation (Location + UserSave + Photos) can partially fail
3. **Duplicate `Photo` type definitions** — Will cause runtime type mismatches
4. **Privacy filter missing** — `searchByLocation()` doesn't filter by `visibility` field
5. **No pagination** — Locations API hardcodes `take: 100`

### 🟡 Significant

6. **No Next.js middleware** — Auth protection is component-level only
7. **Map page is 800 lines** — Needs further decomposition
8. **Excessive production logging** — 50+ debug `console.log` calls ship to production
9. **JWT `verifyToken()` returns `any`** — Untyped throughout the app
10. **`User.role` is a raw string** — Not type-safe at Prisma or TypeScript level
11. **Production script in layout** — tweakcn.com live preview loads for all users
12. **Landing page is fully client-rendered** — Hurts SEO
13. **N+1 query on locations** — Photos fetched per-location in a loop
14. **Projects feature has full schema but zero implementation**

### 🟢 Minor

15. Duplicate `queryClient.clear()` call
16. `userScalable: false` accessibility issue
17. Backup file (`.bak`) in components
18. Both 404 buttons link to the same page
19. `sanitizeHTML()` doesn't do what its name implies
20. Unused `user` import in `usePhotoCacheManager`

---

## Recommendations to Strengthen the App

### Priority 1 — Security & Data Integrity

| # | Recommendation | Impact |
|---|---|---|
| 1 | **Replace in-memory rate limiter with Upstash Redis or Vercel KV** | Enables real brute-force protection |
| 2 | **Wrap location creation in a Prisma `$transaction`** | Prevents orphaned Location/Photo records |
| 3 | **Add Next.js `middleware.ts`** to redirect unauthenticated users server-side | Prevents flash of protected content |
| 4 | **Remove JWT fallback secret** — crash if `JWT_SECRET` is missing | Prevents silent insecure fallback |
| 5 | **Fix `searchByLocation()` visibility filter** | Prevents private location data leakage |
| 6 | **Remove all `console.log` from auth middleware** | Stops PII logging in production |

### Priority 2 — Architecture Improvements

| # | Recommendation | Impact |
|---|---|---|
| 7 | **Consolidate `Photo` type to single source of truth** in `types/photo.ts` and re-export from `types/location.ts` | Eliminates type conflicts |
| 8 | **Migrate all API routes to `withAuth()`** wrapper pattern | Consistent auth + error handling |
| 9 | **Add pagination to locations API** (`page`, `limit`, `cursor`) | Supports growth beyond 100 locations |
| 10 | **Create a `services/` layer** (e.g., `LocationService`, `PhotoService`) | Separates business logic from route handlers |
| 11 | **Type all `any` occurrences:** JWT payload, Prisma `where` clauses | Better IDE support & fewer runtime bugs |
| 12 | **Introduce `useReducer` or Zustand for map page state** | Reduces 15 useState calls to structured state |
| 13 | **Fix N+1 photos query** — use Prisma `include` on the initial query | Single query instead of N+1 |

### Priority 3 — Developer Experience

| # | Recommendation | Impact |
|---|---|---|
| 14 | **Add structured logging** (e.g., `pino` or `winston`) with log levels | Debug in dev, warn/error only in prod |
| 15 | **Create error boundary components** for graceful failure UI | Better UX when things break |
| 16 | **Increase test coverage to at least 40%** — prioritize auth, permissions, location CRUD | Catch regressions early |
| 17 | **Add CI pipeline** (GitHub Actions) with lint, type-check, and test | Automated quality gates |
| 18 | **Make `User.role` a Prisma enum** and TypeScript union type | Database + type-level validation |
| 19 | **Remove tweakcn.com script from production** — wrap in `isDevelopment` check | Reduces production bundle + security surface |
| 20 | **Add Sentry or similar** for production error tracking | Visibility into real user issues |

### Priority 4 — UX & Performance

| # | Recommendation | Impact |
|---|---|---|
| 21 | **Make landing page a Server Component** — move auth redirect logic to a client wrapper | Better SEO + faster first paint |
| 22 | **Server-side filtering + search on locations page** | Reduces client memory usage |
| 23 | **Add skeleton loading states to map panels** | Better perceived performance |
| 24 | **Implement virtual scrolling** for large location lists | Performance with 100+ locations |
| 25 | **Remove `userScalable: false`** from viewport | Accessibility compliance |

---

## Dynamic Feature Readiness Roadmap

To prepare for dynamic features (projects, real-time collaboration, notifications, mobile API), focus on these architectural foundations:

### Phase 1: Foundation Cleanup (1-2 weeks)

```mermaid
graph LR
    A[Consolidate Types] --> B[Add Service Layer]
    B --> C[Transaction Support]
    C --> D[Pagination API]
    D --> E[Redis Rate Limiting]
```

- Unify `Photo`, `PhotoMetadata`, and `User.role` types
- Create `services/location-service.ts`, `services/photo-service.ts`
- Wrap multi-table writes in `prisma.$transaction()`
- Add cursor-based pagination to all list endpoints
- Switch rate limiter to Upstash/Vercel KV

### Phase 2: Projects Feature (2-3 weeks)

The Prisma schema already has `Project`, `ProjectLocation`, `ProjectMember`, and `LocationContact` — all unused. Build on this:

- Create `services/project-service.ts` with CRUD operations
- Add `api/projects/` route handlers using `withAuth()`
- Build `ProjectList`, `ProjectDetail`, `ProjectForm` components
- Implement project-scoped location management
- Add team member invitations via existing email system

### Phase 3: Real-Time & Notifications (2-3 weeks)

- Add WebSocket or Server-Sent Events for real-time location updates
- Build in-app notification system (new follower, shared location, project invite)
- Consider Pusher/Ably or Next.js Server Actions for real-time

### Phase 4: Advanced Features

- **Activity Feed:** Timeline of saves, shares, follows
- **Location Reviews:** Extend `UserSave` with review text and rating
- **Detailed Analytics:** Dashboard with location stats, popular areas
- **Enhanced Search:** Elasticsearch or Typesense for full-text + geo search
- **Offline Support:** Service worker for cached map tiles and saved locations

---

> **Bottom line:** The app has strong fundamentals in security and design, but needs architectural cleanup (type consolidation, service layer, transactions, pagination) before scaling to more dynamic features. The highest-impact changes are fixing the rate limiter, adding transactions, and creating Next.js middleware — these address real security and data integrity risks today.
