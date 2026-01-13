# Vercel Deployment Fix

**Issue**: Vercel is not running the custom build command from `vercel.json`

---

## Quick Fix Options

### Option 1: Configure via Vercel Dashboard (RECOMMENDED)

1. Go to: https://vercel.com/rgriola/fotolokashen/settings/general
2. Scroll to "Build & Development Settings"
3. **Override Build Command**: Check the box
4. Enter: `npm run build:production`
5. Click "Save"
6. Redeploy from dashboard

### Option 2: Use Environment-Based Build Script

Update `package.json` to detect Vercel environment:

```json
{
  "scripts": {
    "build": "npm run build:vercel",
    "build:vercel": "if [ \"$VERCEL\" = \"1\" ]; then npm run build:production; else next build; fi",
    "build:production": "prisma migrate deploy && prisma generate && next build"
  }
}
```

Then push to GitHub.

### Option 3: Remove vercel.json and Configure Project Settings

Since `vercel.json` `buildCommand` is being ignored, configure directly in Vercel:

1. Delete or rename `vercel.json` (or remove `buildCommand` line)
2. Configure in Vercel dashboard as in Option 1
3. Push changes

---

## Why This Happened

Vercel's build command priority:
1. **Vercel Dashboard Settings** (highest priority)
2. `vercel.json` `buildCommand`
3. Framework detection (Next.js = `next build`)

Your `vercel.json` likely isn't being used because:
- Dashboard has an override set, OR
- `buildCommand` in `vercel.json` requires Vercel CLI v48+ (you have v50.1.6, so this is fine)

---

## Immediate Action

**Do this now to fix production:**

1. Go to Vercel Dashboard
2. Settings → General → Build & Development Settings
3. Set Build Command to: `npm run build:production`
4. Redeploy latest commit

---

## Current Build Command Issue

Your production database needs the migration for `avatarFileId` and `bannerFileId`, but Vercel is only running `next build`, not `prisma migrate deploy`.

**This means:**
- Your code expects `avatarFileId` and `bannerFileId` columns
- But production database doesn't have them yet
- App will crash when trying to access those fields

---

## After Fixing Vercel Build Command

You'll also need to create a migration file (since you used `db:push` locally):

```bash
# Create migration from current schema state
npx dotenv -e .env.local -- npx prisma migrate dev --name add_avatar_banner_file_ids --create-only

# Review the migration file
cat prisma/migrations/TIMESTAMP_add_avatar_banner_file_ids/migration.sql

# Commit and push
git add prisma/migrations
git commit -m "chore: add migration for avatarFileId and bannerFileId"
git push origin main
```

This ensures Vercel can apply the schema changes when building.
