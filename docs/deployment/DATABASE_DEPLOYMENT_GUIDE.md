# Database Deployment Guide

**Date:** September 17, 2026  
**Topic:** Schema changes and how they reach production

---

## Quick Answers

### Should `schema.prisma` be in Git?

**YES** ✅ Always commit these files:

- `prisma/schema.prisma` - Source of truth for database structure
- `prisma/migrations/` - All migration files

**NO** ❌ Never commit these (already in `.gitignore`):

- `node_modules/.prisma/` - Generated Prisma Client
- `.env` files - Contains secrets
- `*.tsbuildinfo` - Build cache

---

### Are database migrations automatic?

**NO** ❌ As of September 17, 2026

The Vercel build no longer touches the database at all:

```bash
# During build, Vercel runs:
prisma generate        # ← Regenerates Prisma Client
next build             # ← Builds your app
```

Previously the build ran `prisma db push --accept-data-loss`. That was removed because:

- `--accept-data-loss` could silently drop columns or tables during an unattended CI build
- The build command applies to **preview deployments too**, so any feature-branch build reshaped the production schema
- `db push` never executes raw SQL migration files, so extensions, GIN indexes, and backfills were skipped entirely (this is why `pg_trgm` was missing in production for months)
- The schema changed _before_ `next build` succeeded, and Vercel's instant rollback reverts code but never the database

**Migrations are applied by CI, not by the build.** The
`.github/workflows/migrate-production.yml` workflow runs `prisma migrate deploy`
on every push to `main`. See [Applying a Migration to Production](#applying-a-migration-to-production).

---

## Complete Workflow

### 1. Make Schema Changes Locally

```prisma
// prisma/schema.prisma
model User {
  // ...existing fields...
  newField    String?  // NEW
}
```

### 2. Create Migration (Production-Ready)

```bash
npm run db:migrate -- --name add_new_field
```

This:

- Creates migration file in `prisma/migrations/`
- Applies to your local dev database
- Regenerates Prisma Client

### 3. Test Locally

```bash
npm run dev
# Test your changes thoroughly
```

### 4. Commit & Push

```bash
git add prisma/
git commit -m "feat: add newField to User model"
git push origin main
```

### 5. Push

```bash
git push origin main
```

Two things then happen **in parallel**:

- **GitHub Actions** runs `prisma migrate deploy` against production (seconds)
- **Vercel** runs `prisma generate && next build` (minutes, database untouched)

The migration finishes long before the build does, and production traffic is not
switched over until you promote.

### 6. Promote to Production

Check the Actions tab is green, then:
Vercel Dashboard → Deployments → Promote to Production

---

## Applying a Migration to Production

### Normal path — automatic

Push to `main`. The **Migrate Production Database** workflow
(`.github/workflows/migrate-production.yml`) runs:

1. `prisma migrate status` — logs what is pending
2. `prisma migrate deploy` — applies it
3. `prisma migrate status` — fails the job if anything is still pending
4. `prisma migrate diff` — writes a drift report to the job summary

`migrate deploy` is idempotent: with nothing pending it reports
`No pending migrations to apply.` and exits cleanly, so the workflow is a
harmless no-op on pushes that contain no migrations.

The job uses `concurrency: migrate-production` with `cancel-in-progress: false`.
A cancelled migration is recorded as failed and blocks every later
`migrate deploy` until resolved by hand, so runs queue rather than interrupt.

### Manual fallback

```bash
DATABASE_URL="<production-url>" npx prisma migrate status
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

### Required secret

`DATABASE_URL` under **Settings → Secrets and variables → Actions**, set to the
**production** Neon branch connection string.

> ⚠️ Your local `.env` and `.env.local` point at the **dev** Neon branch. Copying
> that value into the secret would silently migrate the wrong database and leave
> production untouched while CI reports success.

**Ordering rule:** additive changes (new nullable columns, new tables) go to the
database _first_, then the code — which is what the parallel workflow gives you.
Destructive changes (dropping a column) go the other way: ship code that stops
reading it, promote, then drop it in a later migration. Never rename a column in
place; add, backfill, switch reads, then drop.

---

## Build Configuration

### Current Setup

**Local builds** (`npm run build`):

```json
"build": "next build"
```

- For testing locally before pushing
- Doesn't run migrations (no DATABASE_URL needed)
- Fast feedback loop

**Production builds** (`npm run build:production`):

```json
"build:production": "prisma generate && next build"
```

- Only used by Vercel
- **Does not touch the database**
- Configured in `vercel.json`

**Vercel configuration** (`vercel.json`):

```json
{
  "buildCommand": "npm run build:production"
}
```

> ⚠️ A Build Command set in the Vercel dashboard (Settings → General → Build &
> Development Settings) **overrides** `vercel.json`. If schema changes still
> appear on deploy, check for a dashboard override.

This ensures:

- ✅ Builds are reproducible and side-effect free
- ✅ Preview deployments cannot alter the production schema
- ✅ Rolling back code never leaves the database ahead of it

---

## Migration Types Comparison

| Command              | Use Case                            | Creates Files? | Auto-Deploy?                          |
| -------------------- | ----------------------------------- | -------------- | ------------------------------------- |
| `npm run db:push`    | Quick prototyping (dev branch only) | ❌ No          | ❌ No                                 |
| `npm run db:migrate` | Production changes                  | ✅ Yes         | ✅ Yes — via GitHub Actions on `main` |

**For production:** Always use `db:migrate` to create migration files.

---

## What Gets Committed to Git?

### ✅ DO Commit

```
prisma/
  ├── schema.prisma          ← YES (source of truth)
  └── migrations/            ← YES (version history)
      ├── 0_init/
      ├── 20260113172222_enable_search_extensions/
      └── migration_lock.toml
```

### ❌ DON'T Commit (Already in .gitignore)

```
node_modules/
  └── .prisma/               ← NO (generated code)
.env                         ← NO (secrets)
.env.local                   ← NO (secrets)
*.tsbuildinfo                ← NO (build cache)
```

---

## Vercel Environment

### Required Environment Variables

The build itself no longer needs database access, but the running app does:

- `DATABASE_URL` - Auto-added by Vercel Storage ✅
- All other env vars from `.env.local`

**Check:** Vercel Dashboard → Settings → Environment Variables

---

## Troubleshooting

### "Production database out of sync"

This is now the expected failure mode if you deploy code before applying its
migration. Confirm and fix:

```bash
DATABASE_URL="<production-url>" npx prisma migrate status
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

### "Schema still changes on deploy"

`vercel.json` no longer runs `db push`, so a dashboard Build Command override is
the likely cause. Check Vercel Dashboard → Settings → General → Build &
Development Settings.

### "Drift detected" / Prisma wants to drop an index

Raw-SQL objects (extensions, GIN indexes, expression indexes) must also be
declared in `schema.prisma`, or Prisma treats them as drift and proposes
dropping them. Example:

```prisma
@@index([username(ops: raw("gin_trgm_ops"))], map: "idx_users_username_trgm", type: Gin)
```

Verify with:

```bash
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script
# "-- This is an empty migration." means no drift
```

### "Prisma Client out of date"

After pushing, restart the app:

- Vercel Dashboard → Deployments → Redeploy

---

## Best Practices

### ✅ DO

- Create descriptive migration names: `add_avatar_file_ids`
- Test migrations in dev first
- Commit migrations with related code changes
- Review migration SQL before deploying
- Keep migrations small and focused

### ❌ DON'T

- Use `db:push` against production (no migration history, and `--accept-data-loss` can drop data)
- Delete migration files
- Edit applied migrations (create new ones instead)
- Skip testing in development
- Deploy schema changes without code that uses them
- Create raw-SQL indexes without also declaring them in `schema.prisma`

---

## Migration History Baseline

Production was baselined on **September 17, 2026**. Before that date it had no
`_prisma_migrations` table at all, because every deploy ran `db push` instead of
`migrate deploy`.

Current migration history:

```
prisma/migrations/
  ├── 0_init/                                  ← baseline: all 26 tables
  ├── 20260113172222_enable_search_extensions/ ← pg_trgm + search indexes
  └── migration_lock.toml
```

`0_init` was generated with `prisma migrate diff --from-empty
--to-schema-datamodel` and marked as applied on both the dev branch and
production; it is never actually executed against an existing database.

Superseded and malformed migration folders were moved to
`prisma/migrations-archive/` — they are retained for reference only and are not
read by Prisma.

---

## Example: Recent Change

**Added:** `idx_users_username_trgm` declared in `schema.prisma`

**Steps:**

1. Updated `schema.prisma` to declare the GIN index that raw SQL had created
2. Verified zero drift: `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`
3. Confirmed `prisma migrate status` → "Database schema is up to date!"
4. Committed schema + migrations: `git add prisma/`
5. Pushed: `git push origin main`
6. Vercel built — **database untouched** ✅

---

## Summary

**Question:** Should schema.prisma be in Git?  
**Answer:** YES ✅

**Question:** Are migrations automatic?  
**Answer:** YES ✅ — but via GitHub Actions, not the Vercel build (as of Sep 17, 2026)

**Workflow:**

```
Edit schema → Create migration → Test locally → Push to main
   ├─ GitHub Actions: prisma migrate deploy   (database)
   └─ Vercel:         prisma generate && next build   (code only)
→ Check Actions is green → Test preview → Promote
```

---

## Related Documentation

- `DEPLOYMENT.md` - Full deployment guide
- `IMAGEKIT_CLEANUP_IMPLEMENTATION.md` - Recent schema change example
- [Prisma Migrations Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Vercel Build Config](https://vercel.com/docs/build-step)

---

**Last Updated:** January 13, 2026  
**Status:** ✅ Fully Automated
