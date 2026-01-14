# Database Deployment Guide

**Date:** January 13, 2026  
**Topic:** Schema changes and automatic production updates

---

## Quick Answers

### Should `schema.prisma` be in Git?

-- npx dotenv -e .env.local -- npx prisma db push --accept-data-loss


**YES** ✅ Always commit these files:
- `prisma/schema.prisma` - Source of truth for database structure
- `prisma/migrations/` - All migration files

**NO** ❌ Never commit these (already in `.gitignore`):
- `node_modules/.prisma/` - Generated Prisma Client
- `.env` files - Contains secrets
- `*.tsbuildinfo` - Build cache

---

### Are database migrations automatic?

**YES** ✅ As of January 13, 2026

When you push code with schema changes, Vercel automatically:

```bash
# During build, Vercel runs:
prisma migrate deploy  # ← Applies migrations to production DB
prisma generate        # ← Regenerates Prisma Client
next build            # ← Builds your app
```

**No manual database updates needed!**

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

### 5. Vercel Handles Production

**Automatic process:**
1. Vercel detects push to GitHub
2. Runs build command: `prisma migrate deploy && prisma generate && next build`
3. **Migrations applied to production database** ✅
4. Prisma Client regenerated
5. App builds
6. Preview deployed to merkelvision.com

### 6. Promote to Production

After testing preview:
- Vercel Dashboard → Deployments → Promote to Production

**Database is already updated!** No additional steps needed.

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
"build:production": "prisma migrate deploy && prisma generate && next build"
```
- Only used by Vercel
- Applies migrations to production database
- Configured in `vercel.json`

**Vercel configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build:production"
}
```

This ensures:
- ✅ You can test builds locally without database connection
- ✅ Vercel automatically applies migrations on deploy
- ✅ Clean separation of concerns

---

## Migration Types Comparison

| Command | Use Case | Creates Files? | Auto-Deploy? |
|---------|----------|----------------|--------------|
| `npm run db:push` | Quick prototyping (dev only) | ❌ No | ❌ No |
| `npm run db:migrate` | Production changes | ✅ Yes | ✅ Yes (via build) |

**For production:** Always use `db:migrate` to create migration files.

---

## What Gets Committed to Git?

### ✅ DO Commit

```
prisma/
  ├── schema.prisma          ← YES (source of truth)
  └── migrations/            ← YES (version history)
      ├── 20260113_init/
      ├── 20260113_add_user_fields/
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

Vercel needs these to run migrations:

- `DATABASE_URL` - Auto-added by Vercel Storage ✅
- All other env vars from `.env.local`

**Check:** Vercel Dashboard → Settings → Environment Variables

---

## Troubleshooting

### "Migration failed during build"

**Check build logs:**
- Vercel Dashboard → Deployments → Click deployment → View logs
- Look for Prisma migration errors

**Common fixes:**
- Ensure `DATABASE_URL` is set in Vercel
- Check migration files are committed to Git
- Verify schema is valid: `npx prisma validate`

### "Production database out of sync"

**Manually apply migrations:**

```bash
# Get production DATABASE_URL from Vercel
# Then run locally:
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Or use Prisma Studio:

```bash
npx prisma studio --url="<PRODUCTION_DATABASE_URL>"
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

- Use `db:push` for production (no migration history)
- Delete migration files
- Edit applied migrations (create new ones instead)
- Skip testing in development
- Deploy schema changes without code that uses them

---

## Example: Recent Change

**Added:** `avatarFileId` and `bannerFileId` columns

**Steps:**

1. Updated `schema.prisma`
2. Ran `npm run db:push` (dev only, quick iteration)
3. Tested locally
4. Committed schema: `git add prisma/schema.prisma`
5. Pushed: `git push origin main`
6. Vercel built preview → **Migrations auto-applied** ✅
7. Tested preview
8. Promoted to production ✅

**Total time:** ~2 minutes  
**Manual database work:** Zero 🎉

---

## Summary

**Question:** Should schema.prisma be in Git?  
**Answer:** YES ✅

**Question:** Are migrations automatic?  
**Answer:** YES ✅ (as of Jan 13, 2026)

**Workflow:**
```
Edit schema → Create migration → Test locally → Push to GitHub → Vercel auto-applies → Test preview → Promote
```

**No manual database updates required!**

---

## Related Documentation

- `DEPLOYMENT.md` - Full deployment guide
- `IMAGEKIT_CLEANUP_IMPLEMENTATION.md` - Recent schema change example
- [Prisma Migrations Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Vercel Build Config](https://vercel.com/docs/build-step)

---

**Last Updated:** January 13, 2026  
**Status:** ✅ Fully Automated
