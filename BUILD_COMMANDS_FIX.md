# Build Commands Fix - Summary

**Date:** January 13, 2026  
**Issue:** Local `npm run build` failed when trying to run migrations without DATABASE_URL

---

## Problem

When the build command was:
```json
"build": "prisma migrate deploy && prisma generate && next build"
```

Running `npm run build` locally failed with:
```
Error: Environment variable not found: DATABASE_URL
```

**Why?** Prisma migrations need a database connection, but `.env.local` isn't loaded during build.

---

## Solution

Created **two separate build commands**:

### 1. Local Build (for testing)

```json
"build": "next build"
```

**Usage:**
```bash
npm run build
```

**Purpose:**
- Test production build locally
- No database connection required
- Fast feedback before pushing
- ✅ Works now!

---

### 2. Production Build (for Vercel)

```json
"build:production": "prisma migrate deploy && prisma generate && next build"
```

**Usage:** Automatic (Vercel only)

**Purpose:**
- Apply database migrations
- Generate Prisma Client
- Build the app
- Used automatically by Vercel

---

## Vercel Configuration

Created `vercel.json`:

```json
{
  "buildCommand": "npm run build:production",
  "github": {
    "silent": false
  }
}
```

This tells Vercel to use `build:production` instead of the default `build` command.

---

## Complete Workflow

### Local Development

```bash
# 1. Make changes
npm run dev

# 2. Test production build
npm run build  # ✅ No DATABASE_URL needed

# 3. Push when ready
git push origin main
```

### Vercel Deployment

```bash
# Automatic on push:
1. Vercel detects push
2. Runs: npm run build:production
   - prisma migrate deploy  # Applies migrations
   - prisma generate        # Updates Prisma Client
   - next build            # Builds app
3. Deploys preview
4. Ready to promote to production
```

---

## Files Changed

### `package.json`

```diff
  "scripts": {
    "dev": "next dev",
-   "build": "prisma migrate deploy && prisma generate && next build",
+   "build": "next build",
+   "build:production": "prisma migrate deploy && prisma generate && next build",
    "start": "next start",
```

### `vercel.json`

```json
{
  "buildCommand": "npm run build:production",
  "github": {
    "silent": false
  }
}
```

### Updated Documentation

- ✅ `DEPLOYMENT.md` - Updated build command section
- ✅ `DATABASE_DEPLOYMENT_GUIDE.md` - Added build configuration details

---

## Benefits

✅ **Local builds work** - No need for DATABASE_URL locally  
✅ **Vercel builds work** - Migrations run automatically  
✅ **Clear separation** - Different commands for different purposes  
✅ **Fast testing** - Can verify builds before pushing  
✅ **No manual steps** - Database migrations still automatic on deploy

---

## Testing

**Local build test:**
```bash
npm run build
```

Result: ✅ Success! Build completed in ~12 seconds without requiring DATABASE_URL.

**Production build** (Vercel will run):
```bash
npm run build:production
```

This would require DATABASE_URL (only available on Vercel).

---

## Summary

**Before:**
- ❌ `npm run build` required DATABASE_URL
- ❌ Couldn't test builds locally
- ❌ Confusing error messages

**After:**
- ✅ `npm run build` works locally (no database needed)
- ✅ `npm run build:production` used by Vercel (with migrations)
- ✅ Clear separation of concerns
- ✅ Automatic migrations still work on deploy

**Commands to remember:**
```bash
npm run build              # Local testing (no DB required)
npm run build:production   # Vercel only (with migrations)
```

---

**Status:** ✅ Fixed and tested  
**Next deploy:** Will use new build:production command automatically
