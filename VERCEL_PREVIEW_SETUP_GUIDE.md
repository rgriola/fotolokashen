# Vercel Preview Deployment Setup Guide

**Created**: December 28, 2025  
**Purpose**: Test code changes in production-like environment before deploying  
**Target Audience**: Development team

---

## 🎯 What Are Vercel Preview Deployments?

**Preview deployments** are temporary, production-like environments that Vercel automatically creates for every git push to a non-production branch. They help you catch issues before they reach production.

### Key Benefits

✅ **Production-like environment** - Same runtime as production (serverless functions, edge)  
✅ **Automatic creation** - No manual setup needed  
✅ **Unique URLs** - Each preview gets its own URL  
✅ **Environment variables** - Can use different vars from production  
✅ **Safe testing** - Test breaking changes without affecting users  
✅ **Easy sharing** - Share preview URL with team/stakeholders

---

## 🔍 Your Current Setup Issue

### The Problem

You mentioned:
> "I think some of the issues are my dev environment is different from production, for example I am using the production database... or that's how the dev environment was setup."

**This is a RED FLAG! 🚨**

### Why This Is Dangerous

```
┌─────────────────┐
│  Local Dev      │
│  (Your laptop)  │──────► PRODUCTION DATABASE ⚠️
└─────────────────┘        (Live user data!)

Problems:
❌ Testing with real user data
❌ Could accidentally delete/corrupt data
❌ Dev bugs affect production
❌ Can't test migrations safely
❌ Privacy/compliance issues (GDPR)
```

### What Should Happen

```
┌─────────────────┐
│  Local Dev      │──────► LOCAL/DEV DATABASE ✅
└─────────────────┘        (Test data only)

┌─────────────────┐
│  Preview Deploy │──────► PREVIEW DATABASE ✅
└─────────────────┘        (Staging/test data)

┌─────────────────┐
│  Production     │──────► PRODUCTION DATABASE ✅
└─────────────────┘        (Real user data)
```

---

## 🛠️ Setting Up Proper Environments

### Step 1: Create Development Database

**Option A: Local MySQL** (Recommended for offline work)

```bash
# Install MySQL (macOS)
brew install mysql
brew services start mysql

# Create dev database
mysql -u root

CREATE DATABASE google_search_me_dev;
CREATE USER 'dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON google_search_me_dev.* TO 'dev_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

# NOT AN OPTION to use PlantScale
**Option B: PlanetScale Dev Branch** (If using PlanetScale)

```bash
# Install PlanetScale CLI
brew install planetscale/tap/pscale

# Login
pscale auth login

# Create development branch
pscale branch create google_search_me development

# Get connection string
pscale connect google_search_me development
```
NOT AN OPTION Below. 
**Option C: Railway/Supabase Free Tier** (Cloud dev database)

1. Go to [Railway.app](https://railway.app) or [Supabase.com](https://supabase.com)
2. Create new project
3. Add MySQL/PostgreSQL database
4. Copy connection string

### Step 2: Update Your .env.local

Create/update `.env.local` (this file is git-ignored, safe for local secrets):

```bash
# .env.local (LOCAL DEVELOPMENT ONLY)
NODE_ENV=development

# 🔴 LOCAL DEV DATABASE (not production!)
DATABASE_URL=mysql://dev_user:dev_password@localhost:3306/google_search_me_dev

# Same API keys as production (these are safe to share across envs)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id

# Dev email (use Mailtrap)
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASS=your-mailtrap-pass

# Dev JWT secret (different from production!)
JWT_SECRET=dev-jwt-secret-not-for-production-use-only
```

### Step 3: Initialize Dev Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to dev database
npm run db:push

# (Optional) Seed with test data
npm run db:seed
```

---

## 🚀 Setting Up Vercel Preview Deployments

### Step 1: Connect GitHub to Vercel

If not already connected:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `rgriola/merkel-vision`
4. Click "Import"

### Step 2: Configure Environment Variables

**Important**: Vercel has THREE environment scopes:

1. **Production** - Used by `main` branch deployments
2. **Preview** - Used by all other branches
3. **Development** - Used locally (rarely used, prefer `.env.local`)

#### Set Up Preview Environment Variables

1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add each variable with appropriate scope:

```bash
# Example: Add DATABASE_URL for Preview environment

Variable Name: DATABASE_URL
Value: mysql://preview_user:preview_pass@preview-host:3306/merkel_vision_preview
Environment: ✅ Preview (checked), ⬜ Production (unchecked), ⬜ Development (unchecked)
```

**Recommended Preview Setup**:

```bash
# Database - Use separate preview database!
DATABASE_URL=mysql://preview_user:pass@preview-host:3306/merkel_vision_preview

# JWT Secret - Can be different from production
JWT_SECRET=preview-jwt-secret-different-from-prod

# Google Maps - Same as production (no cost impact)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<same-as-production>

# ImageKit - Same as production (or separate preview account)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<same-as-production>
IMAGEKIT_PRIVATE_KEY=<same-as-production>
IMAGEKIT_URL_ENDPOINT=<same-as-production>

# Email - Use Mailtrap for preview (don't send real emails!)
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=<your-mailtrap-user>
EMAIL_PASS=<your-mailtrap-pass>

# Sentry - Optional: separate preview project
SENTRY_DSN=<preview-sentry-dsn>
```

### Step 3: Create a Preview Deployment

**Method 1: Automatic (Recommended)**

```bash
# Create a feature branch
git checkout -b fix/exifr-production-issue

# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Fix: Move exifr to API route for production compatibility"
git push origin fix/exifr-production-issue
```

**Vercel will automatically**:
- Detect the push
- Build your code
- Deploy to a preview URL
- Comment on your GitHub PR (if you create one)

**Method 2: Manual Deploy**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? <your-account>
# - Link to existing project? Yes
# - What's the name of your existing project? merkel-vision
```

### Step 4: Access Your Preview

After deployment completes:

1. **Via Vercel Dashboard**:
   - Go to your project → Deployments
   - Find your branch/commit
   - Click the deployment
   - Click "Visit" button

2. **Via GitHub PR** (if you created a pull request):
   - Look for Vercel bot comment
   - Click the preview URL

3. **Via CLI output**:
   - Look for "Preview:" URL in terminal
   - Example: `https://merkel-vision-git-fix-exifr-rgriola.vercel.app`

---

## 🧪 Testing in Preview Environment

### Checklist for Testing

```bash
# 1. Open preview URL in browser
https://your-preview-url.vercel.app

# 2. Test affected pages
✅ /create-with-photo - Upload photo with GPS
✅ /locations - Check all 3 tabs (grid, list, map)
✅ /map - Main map view
✅ /profile - User profile

# 3. Open browser console (F12)
✅ Check for JavaScript errors
✅ Check Network tab for failed requests
✅ Check Console for warnings

# 4. Test critical user flows
✅ Sign up / Sign in
✅ Create location manually
✅ Create location from photo (THE FIX!)
✅ Edit location
✅ Delete location
✅ View locations on map

# 5. Check Vercel logs
✅ Go to deployment → "Logs" tab
✅ Look for errors during build
✅ Look for errors during runtime
```

### How to Debug Issues

**If exifr still fails in preview**:

```bash
# 1. Check Vercel logs
- Go to Deployment → Logs
- Filter by "Error" or "Warning"
- Look for "exifr", "Module not found", "Cannot find module"

# 2. Check browser console
- F12 → Console tab
- Look for:
  * "Failed to fetch"
  * "Module not found"
  * "Unexpected token" (parsing error)
  * Network errors

# 3. Check build logs
- Look for webpack errors
- Check if exifr was bundled correctly
- Look for "Can't resolve" errors
```

**If /locations page fails**:

```bash
# 1. Verify environment variables
- Vercel Dashboard → Settings → Environment Variables
- Ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY exists in Preview scope
- Check it's the correct value (no typos)

# 2. Test Google Maps API key
- Open browser console
- Type: console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
- Should show your key (if starts with NEXT_PUBLIC_)

# 3. Check Network tab
- F12 → Network
- Look for failed requests to maps.googleapis.com
- Check error responses (403 = invalid key, 404 = not found)
```

---

## 📊 Environment Variable Priority

Understanding how Vercel chooses which variables to use:

```
Preview Deployment Variable Selection:
1. ✅ Environment Variables with "Preview" scope (highest priority)
2. ✅ Environment Variables with "Development" scope (if Preview not set)
3. ✅ Environment Variables with "Production" scope (if neither above set)
4. ❌ .env.local files (NOT uploaded to Vercel, ignored)
```

**Example**:

```bash
# If you have:
DATABASE_URL (Production) = mysql://prod-host/prod-db
DATABASE_URL (Preview) = mysql://preview-host/preview-db

# Preview deployments will use: mysql://preview-host/preview-db ✅
# Production deployments will use: mysql://prod-host/prod-db ✅
```

---

## 🔄 Workflow: Dev → Preview → Production

### Recommended Git Workflow

```bash
# 1. Start feature on new branch
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# 2. Develop locally (uses .env.local)
npm run dev
# Test at http://localhost:3000

# 3. Test production build locally
npm run build
npm run start
# Test at http://localhost:3000

# 4. Push to GitHub → triggers preview
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-new-feature

# 5. Test in preview environment
# - Wait for Vercel to deploy
# - Visit preview URL
# - Test thoroughly

# 6. Create Pull Request
# - Go to GitHub
# - Create PR from feature/my-new-feature → main
# - Get code review

# 7. Merge to main → auto-deploys to production
# - Click "Merge pull request"
# - Vercel auto-deploys to production
# - Monitor closely!

# 8. Monitor production
# - Check Sentry for errors
# - Check Vercel Analytics
# - Test critical flows manually
```

---

## 🐛 Common Preview Deployment Issues

### Issue 1: "Environment variable not found"

**Cause**: Variable not set for Preview scope

**Fix**:
1. Vercel Dashboard → Settings → Environment Variables
2. Find the variable
3. Ensure "Preview" is checked
4. Redeploy (Settings → Deployments → Click ⋯ → Redeploy)

### Issue 2: "Database connection failed"

**Cause**: Preview trying to use production database, which blocks unknown IPs

**Fix**:
1. Create separate preview database
2. Update `DATABASE_URL` environment variable with Preview scope
3. Ensure preview database allows Vercel IP ranges

### Issue 3: "Build failed"

**Cause**: Missing dependencies or build errors

**Fix**:
```bash
# Test build locally first
npm run build

# If it works locally, check Vercel build logs
# Common issues:
# - Missing dependencies (add to package.json)
# - TypeScript errors (fix in code)
# - Environment variables missing during build
```

### Issue 4: "Module not found at runtime"

**Cause**: Dependency issues with serverless bundling

**Fix**:
```typescript
// next.config.ts
experimental: {
  serverComponentsExternalPackages: ['problematic-package']
}
```

---

## 📋 Quick Reference Commands

```bash
# Local development
npm run dev                    # Start dev server
npm run build                  # Test production build
npm run start                  # Run production build locally

# Vercel CLI
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production (dangerous!)
vercel env pull                # Download env vars to .env.local
vercel logs                    # View deployment logs
vercel ls                      # List deployments

# Git workflow
git checkout -b feature/name   # New feature branch
git push origin feature/name   # Push (triggers preview)
git checkout main              # Switch to main
git merge feature/name         # Merge (triggers production deploy)
```

---

## ✅ Action Items for You

### Immediate (Today)

1. **Stop using production database locally**
   - [ ] Set up local MySQL database
   - [ ] Update `.env.local` to use local database
   - [ ] Run `npm run db:push` to initialize schema
   - [ ] Test that local dev still works

2. **Set up preview database**
   - [ ] Create preview/staging database
   - [ ] Add `DATABASE_URL` to Vercel with Preview scope
   - [ ] Test preview deployment connects successfully

3. **Verify Vercel environment variables**
   - [ ] Go to Settings → Environment Variables
   - [ ] Ensure all required variables exist for Preview
   - [ ] Pay special attention to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Short-term (Next Few Days)

4. **Create test branch and preview**
   - [ ] Create branch: `git checkout -b test/preview-setup`
   - [ ] Push to GitHub: `git push origin test/preview-setup`
   - [ ] Wait for Vercel preview to build
   - [ ] Test preview URL
   - [ ] Document any errors you see

5. **Test both affected pages in preview**
   - [ ] Navigate to `/create-with-photo`
   - [ ] Try uploading a photo with GPS
   - [ ] Note exact error message
   - [ ] Navigate to `/locations`
   - [ ] Try all 3 tabs (grid, list, map)
   - [ ] Note exact error message

6. **Share findings**
   - [ ] Screenshot any errors
   - [ ] Copy error messages from console
   - [ ] Share Vercel log URLs
   - [ ] We can then provide targeted fixes

---

## 🎓 Learning Resources

- [Vercel Preview Deployments Docs](https://vercel.com/docs/deployments/preview-deployments)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [Git Feature Branch Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow)

---

## 💡 Pro Tips

1. **Always test in preview first** - Never merge directly to main without preview testing
2. **Use descriptive branch names** - `fix/exifr-issue` not `test` or `temp`
3. **Keep preview database clean** - Reset/seed regularly for consistent testing
4. **Monitor preview deployments** - Check build time, bundle size, warnings
5. **Use Vercel CLI** - Faster iteration than git push/wait/build cycle
6. **Set up branch protection** - Require preview checks to pass before merge

---

**Next Steps**: Follow the "Action Items for You" checklist above, then come back with specific error messages from your preview deployment! 🚀
