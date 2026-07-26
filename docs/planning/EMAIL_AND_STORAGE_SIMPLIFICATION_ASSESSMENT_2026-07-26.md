# Email System & Photo Storage Simplification — Assessment & Execution Plan

**Date created**: July 26, 2026
**Author**: GitHub Copilot (automated codebase assessment)
**Status**: Draft — pending approval before any phase is executed
**Related notepad**: [first-file.md](../../first-file.md)

---

## 0. Project Health Check (context for this assessment)

Quick findings from `PROJECT_STATUS.md`, `TASKS.md`, `package.json`, and the codebase, since the project hasn't had a structured review in months:

- **Last status update**: 2026-05-08 (iOS v1.6.0). Web is `next@16.1.6` / React 19.2.1 / Prisma 6.19.1 — current, no urgent framework upgrades needed.
- **Test status** (per `TASKS.md`, 2026-05-03): 51/51 Vitest tests passing. Test suite lives in `src/lib/__tests__/*.test.ts` (Vitest, `node` environment, path alias `@/*`).
- **Open P0/P1 items** already tracked in `TASKS.md` (session hardening, email verification UX, perf/caching, test coverage expansion) — none of these block the work below, but **Part A of this plan overlaps with "Email Verification UX Completion"** — coordinate so we don't rebuild UX we're about to simplify.
- **Dependency footprint relevant to this plan**:
  - Email: `resend`, `nodemailer` (+`@types/nodemailer`), `handlebars`, `isomorphic-dompurify` (+`@types/dompurify`)
  - Photos: `imagekit`, `imagekitio-react`, `sharp`, `clamscan` (+`@types/clamscan`), `heic2any`, `utif`, `exifr`
- **No admin design audit yet** — `.github/copilot-instructions.md` explicitly calls out `/src/app/admin/**` as exempt from the current color-token audit. Good, because most of what we're deleting lives there.

Nothing found blocks starting Part A or Part B. Proceed with the phased plan.

---

## 1. Current State — Email System

### 1.1 What exists today

The "custom email UI" is a full **database-backed template engine with admin CRUD + versioning**, not just hard-coded strings:

| Piece               | Location                                                                                                                                    | Purpose                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB models           | `prisma/schema.prisma` — `EmailTemplate`, `EmailTemplateVersion`, `EmailLog`                                                                | Templates stored in DB, versioned, logged                                                                                                                                                                              |
| Admin UI            | `src/app/admin/email-templates/` (`page.tsx`, `[id]/edit`, `new`)                                                                           | List/create/edit/test/revert templates                                                                                                                                                                                 |
| Admin UI            | `src/app/admin/email-preview/page.tsx`                                                                                                      | Preview rendering                                                                                                                                                                                                      |
| Admin API           | `src/app/api/admin/email-templates/**` (`route.ts`, `[id]/route.ts`, `[id]/test`, `[id]/duplicate`, `[id]/revert`, `[id]/versions`, `seed`) | 7 route files                                                                                                                                                                                                          |
| Template service    | `src/lib/email-template-service.ts`                                                                                                         | Handlebars rendering, DOMPurify sanitization, in-memory cache (5 min TTL), version snapshots                                                                                                                           |
| Hard-coded fallback | `src/lib/email-templates.ts`                                                                                                                | Original HTML string templates (`verificationEmailTemplate`, `welcomeToEmailTemplate`, `passwordResetEmailTemplate`, `passwordChangedEmailTemplate`, `accountDeletionEmailTemplate`) — still used when DB lookup fails |
| Sender              | `src/lib/email.ts`                                                                                                                          | Resend integration; tries DB template first (`USE_DB_TEMPLATES` env flag), falls back to hard-coded template; logs every send/failure to `EmailLog`                                                                    |
| Env validation      | `src/lib/env.ts`                                                                                                                            | `EMAIL_MODE`, `EMAIL_SERVICE`, `EMAIL_API_KEY`, `RESEND_WEBHOOK_SECRET`, SMTP fallback vars                                                                                                                            |

Key observation: **`email.ts` already has a hard-coded-template fallback path for every email type.** This means the "config file with strings" the user wants essentially already exists in `email-templates.ts` — it's just not the primary path today. Simplification is a _subtraction_ (remove DB layer + admin UI + versioning + Handlebars-in-DB), not a rebuild.

### 1.2 Confirmed: Admin-only feature

- Grep confirms all `EmailTemplate`/`EmailTemplateVersion` CRUD routes live under `/api/admin/**` and are gated by admin auth middleware (not verified line-by-line for this doc, but path convention + `.github/copilot-instructions.md` confirm admin-only intent).
- `EmailLog` (send/fail audit trail) is **not** admin-only in purpose — it's used for delivery observability and Resend webhook correlation (see `docs/` webhook notes and user memory: "Resend webhook verification... persist provider messageId from send logs"). **Keep `EmailLog`**, even after removing the template editor.

### 1.3 iOS impact

**None functionally.** iOS has no admin features and never renders emails — it only triggers email sends indirectly via API calls (`/api/auth/oauth/token` registration, password reset, etc.) with an optional `platform=ios` query param baked into the URL inside the email body (`sendVerificationEmail`, `sendPasswordResetEmail`). This logic lives in `email.ts` and is **unaffected** by removing the DB/admin layer — it will be preserved in the simplified sender.

---

## 2. Target State — Email System

Replace the DB-backed template system with a **single static config file** of strings (subject + body per email type), still sent via Resend, with the existing dev-mode console logging preserved.

```
src/lib/email-content.ts   ← NEW: single source of truth (subject + HTML/text body builders)
src/lib/email.ts           ← SIMPLIFIED: no DB lookup, no cache, calls email-content.ts directly
```

Remove:

- `prisma` models: `EmailTemplate`, `EmailTemplateVersion` (+ relation fields on `User`)
- `src/app/admin/email-templates/**`, `src/app/admin/email-preview/**`
- `src/app/api/admin/email-templates/**` (all 7 route files)
- `src/lib/email-template-service.ts`
- `prisma/seed-email-templates.ts`
- `handlebars`, `isomorphic-dompurify` deps (unless DOMPurify is used elsewhere — verify before removing; grep shows it's also imported for sanitizing user HTML elsewhere, so **check `src/lib/sanitize.ts` usage first** — do not blindly remove the package)

Keep:

- `EmailLog` model + writes in `email.ts` (delivery audit trail, webhook correlation)
- `src/lib/email-templates.ts` → rename/merge into `email-content.ts`, keep the same exported function names to minimize call-site churn in `email.ts`
- Resend integration, `EMAIL_MODE` dev-console-log behavior, `platform` query param logic, rate limiting on password-reset/register endpoints

---

## 3. Current State — Photo Storage (ImageKit)

### 3.1 Scope

`imagekit` is referenced in **52 files / ~380 occurrences** across the web app: components (`ImageKitUploader`, `PhotoLightbox`, `PhotoGallery`, avatar/banner upload), hooks (`usePhotoCacheManager`), API routes (upload, avatar, banner, delete-account, admin user delete, location photos, request-upload/confirm signed-URL flow), `src/lib/imagekit.ts` (URL builders, variant/transform helpers), and two dedicated test files (`imagekitVariants.test.ts`, `mobileApiV1Contract.test.ts`).

Two upload paths exist today:

1. **Server-mediated** (`/api/photos/upload`): file → `requireAuth` → MIME/extension allowlist → size limit → **ClamAV scan (`virus-scan.ts`)** → Sharp HEIC/TIFF→JPEG conversion → `uploadToImageKit`. Used by iOS and web avatar/banner/location uploads.
2. **Client-signed direct upload** (`/api/locations/[id]/photos/request-upload` + `/confirm`, `/api/imagekit/auth`): browser gets a signed ImageKit auth token and uploads directly to ImageKit CDN, then confirms metadata server-side. **This path bypasses server-side virus scanning** — flag this as a pre-existing security gap regardless of vendor decision (see §6 Risks).

### 3.2 iOS impact

**Low.** Confirmed via `PhotoUploadService.swift` — the iOS app has **zero direct ImageKit references**. It only calls `/api/photos/upload` and consumes JSON (`SecureUploadResponse`), matching the copilot-instructions.md statement: "All uploads go through `/api/photos/upload`." The iOS `Photo` model does parse `imagekitFileId` / `imagekitFilePath`-shaped fields per `/docs/api/MOBILE_API_SCHEMAS.md`, so **any vendor swap must either preserve these field names in the API response or ship a coordinated schema version bump documented in `MOBILE_API_SCHEMAS.md` and mirrored in the iOS `Photo.swift`/`Social.swift` models.** This is the main cross-repo coordination risk.

### 3.3 Data model coupling

`prisma/schema.prisma` `Photo` model hard-codes `imagekitFileId` / `imagekitFilePath` as required `String` fields (not nullable, no vendor abstraction). Any migration needs either:

- (a) rename to vendor-neutral `storageFileId` / `storageFilePath` + a `storageProvider` enum column, with a data migration for existing rows, or
- (b) keep field names for backward compatibility and just change what populates them (fastest, least churn, but leaves misleading naming — acceptable for a "simplify first" goal).

**Recommendation: (b) for now.** Renaming touches 52 files for cosmetic reasons; not worth the risk given "simplify" is the stated goal, not "rename everything."

---

## 4. Target State — Photo Storage

### 4.1 Recommended architecture: storage adapter abstraction (do this regardless of vendor choice)

Introduce `src/lib/storage/` with a single interface so the rest of the app never calls the vendor SDK directly:

```ts
// src/lib/storage/types.ts
interface StorageAdapter {
  upload(
    buffer: Buffer,
    opts: { folder: string; filename: string; mimeType: string },
  ): Promise<{ fileId: string; filePath: string; url: string }>;
  delete(fileId: string): Promise<void>;
  getUrl(filePath: string, variant: PhotoVariant): string; // same variants as today: thumbnail/card/gallery/full/og
}
```

`src/lib/imagekit.ts` becomes `src/lib/storage/imagekit-adapter.ts` implementing this interface; all 52 call sites import from `src/lib/storage` (a thin re-export) instead of `@/lib/imagekit`. This alone de-risks a future vendor swap to a mechanical find-and-replace instead of a rewrite, **and can be done before deciding on a new vendor.**

### 4.2 Vendor options considered (image + future short-video)

| Vendor                                                                  | Image validation/sanitization                                                                         | Video support                                                                                                                          | Rough cost at current scale (small app, low 1000s of photos/mo)                                                        | Migration effort                                                                                          | Notes                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Images + Cloudflare Stream**                               | Built-in resizing/variants; no built-in AV scan (keep ClamAV in front)                                | Stream handles transcoding, adaptive playback, thumbnails                                                                              | ~$5/mo base (Images) + per-1000-images-stored + per-100k-delivered; Stream ~$5/1000 min stored + $1/1000 min delivered | Medium — different variant/transform URL syntax, need adapter rewrite of `getPhotoUrl`/`PHOTO_TRANSFORMS` | Best "one vendor for photo + video" story; keeps CDN globally close to users                                                                                                                                              |
| **AWS S3 + CloudFront + Lambda@Edge (or Sharp in a Lambda) for resize** | You own the pipeline — keep existing ClamAV + Sharp exactly as-is, just change the upload destination | Requires separate transcoding (MediaConvert) — more moving parts                                                                       | Storage/egress usually cheapest at scale, but resize-on-the-fly needs custom Lambda + more ops                         | High — most engineering-heavy option (build your own image transform service)                             | Only recommended if there's an existing AWS footprint; otherwise adds ops burden this project doesn't currently have (no AWS mentioned anywhere in the codebase)                                                          |
| **Bunny.net (Storage + Optimizer + Stream)**                            | No built-in scanning (keep ClamAV)                                                                    | Bunny Stream is cheap and simple                                                                                                       | Very low cost (~$0.01-0.02/GB storage, cheap optimizer add-on, Stream ~$0.005/min encode)                              | Medium — similar adapter rewrite, simpler API than AWS                                                    | Good low-cost, low-ops middle ground; smaller ecosystem/community than Cloudflare                                                                                                                                         |
| **Supabase Storage**                                                    | No built-in scanning/transform beyond basic resize via image transformation API (paid tier)           | No native video transcoding                                                                                                            | Low, bundled if already on Supabase (this project is not)                                                              | Medium-High — would introduce a whole new platform dependency for storage only                            | Not recommended — don't adopt a new platform just for storage when not already using Supabase elsewhere                                                                                                                   |
| **Stay on ImageKit, just tighten usage**                                | Already integrated, already has transformations                                                       | ImageKit does support video, but the account context here appears to be on a free/test-mode tier per user's note ("test feature mode") | $0 migration cost                                                                                                      | None                                                                                                      | If the only issue is being in "test mode," the cheapest path is **upgrading the existing ImageKit plan** rather than migrating vendors — get a real quote from ImageKit before committing engineering time to a migration |

**Time estimate for a full vendor migration** (once a vendor is chosen), assuming the adapter abstraction from §4.1 is in place first:

- Adapter layer introduction (no vendor change yet): **0.5–1 day** (mechanical import swap + 1 new test file)
- New adapter implementation + signed-upload flow rewrite (`request-upload`/`confirm`/`/api/imagekit/auth` equivalents): **2–4 days**
- Data backfill / dual-write period for existing photos (old ImageKit URLs must keep resolving until re-hosted or forever, since `Photo.imagekitFilePath` is permanent per-row): **1–2 days** engineering + passive monitoring window
- iOS coordination (only if response field names change): **0.5 day** iOS-side, needs a version bump communicated via `MOBILE_API_SCHEMAS.md`
- Video (future) support: **out of scope for this phase** — track as a separate follow-up once photo migration is stable, since it requires transcoding infra most of the above vendors don't include for free

**Total realistic estimate: ~1–1.5 weeks of focused engineering time for the image-only migration**, not counting the "get a real ImageKit pricing quote" fast path, which could make this unnecessary.

### 4.3 Recommendation

1. **First**, get ImageKit's actual production pricing (this may resolve the whole issue for $0 engineering cost).
2. **Regardless**, ship the storage adapter abstraction (§4.1) — it's low-risk, immediately reduces vendor lock-in, and is a prerequisite for any future migration either way.
3. **Do not migrate vendors in this phase.** Treat vendor migration as a separately-scoped Phase 3+ (see roadmap) gated on the pricing conversation and a decision on video requirements.
4. **Fix the direct-upload virus-scan gap** (§3.1 point 2) — this is a real security issue independent of vendor choice, and cheap to fix now: either scan client-signed uploads asynchronously post-confirm and quarantine on infection, or migrate that flow onto the same server-mediated pipeline as `/api/photos/upload`.

---

## 5. Phased Execution Plan (for an executing agent)

Each phase should be a separate PR/commit set. Do not start Phase 2 until Phase 1 tests pass; do not start Phase 4 until Phase 3 is merged.

### Phase 1 — Email: introduce static config, dual-run for safety

1. Create `src/lib/email-content.ts`: move all HTML builder functions from `src/lib/email-templates.ts` here unchanged (same names/signatures) plus a subject-string map:
   ```ts
   export const EMAIL_SUBJECTS = {
     verification: "Verify your email address for Fotolokashen",
     welcome: "Email Confirmed - Welcome to Fotolokashen!",
     password_reset: "Reset your password",
     password_changed: "Your password was changed",
     account_deletion: "Your account has been deleted",
   } as const;
   ```
2. In `src/lib/email.ts`, remove the `getRenderedEmail` (DB) branch and `USE_DB_TEMPLATES` flag; call `email-content.ts` builders directly for every send function. Keep `EMAIL_MODE === 'development'` console-log branches untouched. Keep `EmailLog` writes untouched.
3. Do **not** touch `prisma/schema.prisma` yet in this phase — DB models stay so rollback is trivial.
4. Add unit tests (new file `src/lib/__tests__/emailContent.test.ts`):
   - Each exported template function returns a string containing the expected variable substitutions (e.g., `verificationEmailTemplate('alice', 'https://x/verify?token=1')` contains `alice` and the URL).
   - `EMAIL_SUBJECTS` has an entry for every email type referenced in `email.ts` (guards against typos/missing keys).
5. Update existing tests that reference `email-template-service` or DB template flow, if any (`grep -r "email-template-service" src/`), to remove those assertions.
6. **Manual verification**: run `npm run dev`, trigger register/forgot-password locally with `EMAIL_MODE=development`, confirm console output unchanged in format.

### Phase 2 — Email: remove admin UI + DB layer

1. Delete: `src/app/admin/email-templates/`, `src/app/admin/email-preview/`, `src/app/api/admin/email-templates/`, `src/lib/email-template-service.ts`, `prisma/seed-email-templates.ts`.
2. Remove any admin nav links pointing to these routes (grep `email-templates|email-preview` under `src/components/layout/` and `src/app/admin/page.tsx` or equivalent admin dashboard/sidebar).
3. Update `prisma/schema.prisma`: remove `EmailTemplate`, `EmailTemplateVersion` models and their relation fields on `User` (`createdTemplates`, `updatedTemplates`, `createdTemplateVersions`). **Keep `EmailLog`** but change its `templateId Int?` relation — since `EmailTemplate` is gone, either drop the `template` relation field (keep `templateId` as a plain nullable `Int` for historical record only) or drop the column entirely if no code reads it. Recommendation: drop the relation, keep `templateId` as an unrelated nullable int purely for audit-log history of what was sent before the migration.
4. Run `npm run db:push` (dev) — confirm no data you need is lost; this is a destructive schema change, so **get explicit user confirmation before running against any environment with real templates people have customized.** If any admin has actually created _custom_ (non-default) templates via the UI historically, export them first (e.g., `SELECT * FROM email_templates WHERE "isDefault" = false`) so their content can be manually folded into `email-content.ts` if still wanted.
5. Remove `handlebars` from `package.json` if no other usage remains (`grep -r "handlebars" src/` after deletion — expect zero hits).
6. Re-run full test suite: `npm run test`. Fix any admin-route tests that reference deleted endpoints.
7. Update docs: `docs/planning/DYNAMIC_EMAIL_TEMPLATES_PLAN.md` — mark as superseded/archived (move to `docs/archive/`) since this plan reverses it.

### Phase 3 — Photo storage: adapter abstraction (no vendor change)

1. Create `src/lib/storage/types.ts` (interface from §4.1), `src/lib/storage/imagekit-adapter.ts` (current `imagekit.ts` logic, renamed exports to match interface), `src/lib/storage/index.ts` (re-exports current public API: `getPhotoUrl`, `getPhotoVariants`, `attachPhotoSizes`, `getImageKitFolder`, `uploadToImageKit`, `deleteFromImageKit`, `generateSignedUploadUrl` — same names so call sites don't change yet).
2. Point `src/lib/imagekit.ts` to re-export from `src/lib/storage` (keep the old import path alive as a thin compatibility shim) **or** do a mechanical rename of all 52 import sites from `@/lib/imagekit` to `@/lib/storage` in this same phase — prefer the rename now while the change is small and test-covered, rather than leaving two import paths alive long-term.
3. Add unit test `src/lib/storage/__tests__/adapter.test.ts`: verify the adapter implements the full `StorageAdapter` interface shape and that `getPhotoUrl`/`getPhotoVariants` output is byte-identical to the pre-refactor `imagekitVariants.test.ts` expectations (i.e., re-run that existing test file unmodified against the new module path).
4. No Prisma schema changes in this phase. No behavior change — this is a pure refactor; the existing `mobileApiV1Contract.test.ts` must still pass unmodified (iOS contract unaffected).

### Phase 4 — Photo storage: fix direct-upload virus-scan gap (independent, can run anytime after Phase 3)

1. In `/api/locations/[id]/photos/confirm/route.ts`, after confirming the ImageKit upload, enqueue (or synchronously run, if latency budget allows) a virus scan of the uploaded file by fetching it back from the CDN URL and running `scanFile`.
2. If infected: delete from storage via `deleteFromImageKit`/adapter, delete/mark the `Photo` row, write a `SecurityLog` entry with `eventType: 'PHOTO_UPLOAD_BLOCKED'` (mirrors existing pattern in `/api/photos/upload/route.ts`).
3. Add unit test: mock `scanFile` to return `isInfected: true`, assert the confirm route rejects and cleans up (adapter `delete` called, `SecurityLog.create` called).

### Phase 5 — Photo storage: vendor migration (separate, gated decision — do not start without explicit go-ahead)

Only after: (a) ImageKit pricing conversation resolved, (b) Phase 3 adapter shipped and stable, (c) explicit user sign-off on target vendor and video requirements. Out of scope for immediate execution; tracked here so the roadmap is visible.

---

## 6. Risks & Rollback

| Risk                                                                                           | Mitigation                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin has hand-edited email templates in the DB that aren't reflected in `email-templates.ts`  | Export `email_templates` table (`isDefault = false` rows) before Phase 2 destructive migration; manually review with user before dropping tables                                                                           |
| Removing Handlebars breaks something else that imports it                                      | Grep for `handlebars` usage outside `email-template-service.ts` before removing the dependency                                                                                                                             |
| Dropping `EmailTemplate`/`EmailTemplateVersion` is irreversible once run against production DB | Treat `db:push`/`migrate` in Phase 2 step 4 as a destructive-action checkpoint — **stop and ask the user for explicit confirmation before running against production**, per this agent's standing operational-safety rules |
| iOS silently breaks if photo API response field names change during a future storage migration | Never rename `imagekitFileId`/`imagekitFilePath` in API responses without a documented `MOBILE_API_SCHEMAS.md` version bump and coordinated iOS release                                                                    |
| Client-signed direct photo upload path bypasses virus scanning today                           | Phase 4 closes this gap independent of any vendor decision — treat as its own small security fix, not blocked on Part B's larger vendor question                                                                           |

---

## 7. Summary of Deliverables Per Phase

| Phase     | Deletes                                                    | Adds                  | Tests added                         |
| --------- | ---------------------------------------------------------- | --------------------- | ----------------------------------- |
| 1         | —                                                          | `email-content.ts`    | `emailContent.test.ts`              |
| 2         | Admin email UI/API, `email-template-service.ts`, DB models | —                     | Updated/removed admin-route tests   |
| 3         | —                                                          | `src/lib/storage/*`   | `storage/__tests__/adapter.test.ts` |
| 4         | —                                                          | Scan-on-confirm logic | Confirm-route infected-file test    |
| 5 (gated) | ImageKit adapter (eventually)                              | New vendor adapter    | New adapter test suite              |

**Immediate next step**: confirm with the user (a) whether any admin has customized email templates in the DB (check before Phase 2 is destructive), and (b) get an ImageKit pricing quote before committing to Phase 5.
