# Complete PostgreSQL Database Setup Guide

**Date**: December 30, 2025  
**Purpose**: Understand all three environments and their database connections  
**Status**: Local Dev ✅ | Preview ⏳ | Production ⏳

---

## 🗺️ The Big Picture

You have **THREE separate environments**, each needs its **own database connection**:

```
┌─────────────────────────────────────────────────────────────┐
│                   YOUR PROJECT SETUP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  LOCAL DEVELOPMENT (Your Laptop)                       │
│     ├── Code: /google-search-me-refactor/                  │
│     ├── Command: npm run dev                               │
│     ├── URL: http://localhost:3000                         │
│     ├── Reads from: .env.local                             │
│     └── Database: Neon Development Branch ✅               │
│         └── ep-solitary-waterfall-a4yhnlsh-pooler          │
│                                                             │
│  2️⃣  PREVIEW (Vercel - Test Branches)                      │
│     ├── Code: Any branch except main                       │
│     ├── Trigger: git push origin feature-branch            │
│     ├── URL: https://merkel-vision-git-branch-rgriola...   │
│     ├── Reads from: Vercel Environment Variables (Preview) │
│     └── Database: Should use Production DB ⏳              │
│         └── ep-cool-star-a4dyxqi4-pooler                   │
│                                                             │
│  3️⃣  PRODUCTION (Vercel - Live Site)                       │
│     ├── Code: main branch only                             │
│     ├── Trigger: git push origin main                      │
│     ├── URL: https://merkel-vision.vercel.app              │
│     ├── Reads from: Vercel Env Variables (Production)      │
│     └── Database: Production DB ⏳                         │
│         └── ep-cool-star-a4dyxqi4-pooler                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Your Current Database Connections

### Connection String Breakdown

A PostgreSQL connection string looks like this:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?options
```

**Example**:
```
postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-solitary-waterfall-a4yhnlsh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
             └─────────┘ └────────────────┘ └──────────────────────────────────────────────────────────────────┘ └─────┘ └──────────────┘
           Username    Password           Host (Server Address)                                                Port    Database Name
```

### Your Two Neon Databases

#### 1️⃣ Development Branch (For Local Dev)
```bash
# This is what's in your .env.local (LOCAL ONLY)
DATABASE_URL="postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-solitary-waterfall-a4yhnlsh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Breakdown:
# - Username: neondb_owner
# - Password: npg_NleqRP7KmjQ0
# - Host: ep-solitary-waterfall-a4yhnlsh-pooler.us-east-1.aws.neon.tech
# - Database: neondb
# - Purpose: Your laptop development
```

#### 2️⃣ Production Database (For Preview & Production)
```bash
# This should be in Vercel Environment Variables
DATABASE_URL="postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Breakdown:
# - Username: neondb_owner
# - Password: npg_NleqRP7KmjQ0
# - Host: ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech
# - Database: neondb
# - Purpose: Vercel Preview AND Production
```

**Notice the difference**: The HOST is different!
- Development: `ep-solitary-waterfall-a4yhnlsh-pooler` ← Different branch
- Production: `ep-cool-star-a4dyxqi4-pooler` ← Original/main branch

---

## 🎯 How Environment Variables Work

### Local Development
When you run `npm run dev` on your laptop:

1. Next.js looks for `.env.local` first
2. Reads `DATABASE_URL` from there
3. Connects to your Neon development branch
4. **Never uses Vercel environment variables**

**Your .env.local (CORRECT ✅)**:
```bash
DATABASE_URL="postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-solitary-waterfall-a4yhnlsh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Preview Deployments (Vercel)
When you push to a branch like `test/vercel-preview-setup`:

1. Vercel builds your code
2. Looks for environment variables tagged **Preview**
3. Uses those to connect to database
4. **Does NOT use your .env.local file**

**What Vercel needs (MISSING ⏳)**:
```
Variable Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: ✅ Preview (checked)
```

### Production Deployment (Vercel)
When you push to `main` branch:

1. Vercel builds your code
2. Looks for environment variables tagged **Production**
3. Uses those to connect to database
4. **Does NOT use your .env.local file**

**What Vercel needs (MISSING ⏳)**:
```
Variable Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: ✅ Production (checked)
```

---

## 🔧 Setting Up Vercel Environment Variables

### Step-by-Step Instructions

#### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Click on your **merkel-vision** project

#### 2. Navigate to Environment Variables
- Click **Settings** (in the top menu)
- Click **Environment Variables** (in the left sidebar)

#### 3. Add DATABASE_URL for Preview

Click **"Add New"** button:

```
┌─────────────────────────────────────────────────────┐
│ Add Environment Variable                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Name:                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ DATABASE_URL                                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Value:                                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ postgresql://neondb_owner:npg_NleqRP7KmjQ0@    │ │
│ │ ep-cool-star-a4dyxqi4-pooler.us-east-1...      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Environments:                                       │
│ ☑ Preview     ← CHECK THIS!                        │
│ ☐ Production  ← UNCHECK for now                    │
│ ☐ Development ← UNCHECK (not used)                 │
│                                                     │
│                             [Cancel] [Save]         │
└─────────────────────────────────────────────────────┘
```

Click **Save**

#### 4. Add DATABASE_URL for Production

Click **"Add New"** button again:

```
┌─────────────────────────────────────────────────────┐
│ Add Environment Variable                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Name:                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ DATABASE_URL                                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Value:                                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ postgresql://neondb_owner:npg_NleqRP7KmjQ0@    │ │
│ │ ep-cool-star-a4dyxqi4-pooler.us-east-1...      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Environments:                                       │
│ ☐ Preview     ← UNCHECK                            │
│ ☑ Production  ← CHECK THIS!                        │
│ ☐ Development ← UNCHECK (not used)                 │
│                                                     │
│                             [Cancel] [Save]         │
└─────────────────────────────────────────────────────┘
```

Click **Save**

#### 5. Verify Both Are Saved

You should now see:

```
Environment Variables (2)

┌──────────────┬───────────────────────┬──────────────────┐
│ Name         │ Value                 │ Environments     │
├──────────────┼───────────────────────┼──────────────────┤
│ DATABASE_URL │ postgresql://neond... │ Preview          │
│ DATABASE_URL │ postgresql://neond... │ Production       │
└──────────────┴───────────────────────┴──────────────────┘
```

**Note**: Vercel allows the same variable name for different environments!

---

## 🔍 Viewing Your Databases in Neon

### Step 1: Log into Neon Console
1. Go to: https://console.neon.tech/
2. Log in with your account
3. You should see your project (probably named "merkel-vision" or similar)

### Step 2: Understanding the Neon Interface

Once logged in, you'll see:

```
┌────────────────────────────────────────────────────┐
│ 🏠 Projects                                        │
├────────────────────────────────────────────────────┤
│                                                    │
│ 📁 Your Project Name                               │
│    └── 🌿 Branches (2)                             │
│         ├── main (default) ← Production DB         │
│         └── development    ← Your dev DB           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Step 3: View Development Branch

1. Click on your project name
2. Look for **"Branches"** in the left sidebar
3. Click on **"development"** branch
4. You'll see:
   - **Connection String** (the one you're using in .env.local)
   - **Database**: neondb
   - **Metrics**: CPU, Memory, Storage usage
   - **Query statistics**

### Step 4: View Production Branch

1. Still in the "Branches" section
2. Click on **"main"** branch (or default branch)
3. You'll see:
   - **Connection String** (the one for Vercel)
   - **Database**: neondb
   - **Metrics**: Usage stats
   - **Query statistics**

### Step 5: Browse Data in Neon

Neon has a built-in SQL editor:

1. Click on your branch (development or main)
2. Click **"SQL Editor"** in the left sidebar
3. You can run queries like:
   ```sql
   -- View all tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Count users
   SELECT COUNT(*) FROM users;
   
   -- View recent locations
   SELECT * FROM locations ORDER BY "createdAt" DESC LIMIT 10;
   ```

### Alternative: Use Prisma Studio

Even easier - use Prisma Studio to browse your databases:

**For Development Database** (local):
```bash
# Your .env.local is already set to development
npx prisma studio
# Opens http://localhost:5555
```

**For Production Database** (temporarily):
```bash
# Temporarily change DATABASE_URL in .env.local
# Replace with production connection string
# Then run:
npx prisma studio

# ⚠️ BE CAREFUL - You're viewing LIVE production data!
# Don't delete or modify anything!
```

---

## 📋 Quick Reference

### Connection Strings Summary

| Environment | Database | Connection String |
|------------|----------|-------------------|
| **Local Dev** | Neon Development Branch | `postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-solitary-waterfall-a4yhnlsh-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| **Vercel Preview** | Neon Production | `postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| **Vercel Production** | Neon Production | `postgresql://neondb_owner:npg_NleqRP7KmjQ0@ep-cool-star-a4dyxqi4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |

**Key Point**: Preview and Production use the SAME database (production)!

### Environment Variable Locations

| Environment | Where Variables Are Stored |
|------------|----------------------------|
| **Local Dev** | `.env.local` file on your laptop |
| **Vercel Preview** | Vercel Dashboard → Settings → Environment Variables (Preview checked) |
| **Vercel Production** | Vercel Dashboard → Settings → Environment Variables (Production checked) |

---

## ✅ Action Checklist

Let's fix your Preview and Production:

### Step 1: Verify Local Dev (Already Working ✅)
- [x] `.env.local` has development branch connection
- [x] `npm run dev` works
- [x] Can log in and use the app

### Step 2: Set Up Vercel Preview
- [ ] Go to Vercel Dashboard
- [ ] Navigate to Settings → Environment Variables
- [ ] Add `DATABASE_URL` with **Preview** checked
- [ ] Value: Production connection string
- [ ] Save

### Step 3: Set Up Vercel Production
- [ ] Still in Environment Variables
- [ ] Add `DATABASE_URL` with **Production** checked
- [ ] Value: Production connection string (same as Preview)
- [ ] Save

### Step 4: Trigger a New Preview Deploy
- [ ] Make a small change to your code
- [ ] Commit: `git commit -m "test: Trigger preview with DB configured"`
- [ ] Push: `git push origin test/vercel-preview-setup`
- [ ] Wait for Vercel to build
- [ ] Test the preview URL

### Step 5: Check Other Required Variables

Make sure ALL these are set in Vercel (both Preview & Production):

```
✅ DATABASE_URL
✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
✅ NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
✅ IMAGEKIT_PRIVATE_KEY
✅ IMAGEKIT_URL_ENDPOINT
✅ JWT_SECRET
✅ EMAIL_SERVICE
✅ EMAIL_API_KEY
✅ NEXT_PUBLIC_SENTRY_DSN
```

---

## 🔍 Debugging Vercel Issues

### If Preview Still Doesn't Work

1. **Check Vercel Build Logs**:
   - Go to Vercel Dashboard → Deployments
   - Click on your preview deployment
   - Click "Logs" tab
   - Look for database connection errors

2. **Check Runtime Logs**:
   - Same deployment page
   - Click "Functions" tab
   - Check for runtime errors

3. **Verify Environment Variables**:
   - Settings → Environment Variables
   - Make sure `DATABASE_URL` shows up for Preview
   - Check the value starts with `postgresql://`

4. **Check Vercel Deployment Settings**:
   - Settings → General
   - Make sure "Automatically expose System Environment Variables" is ON

---

## 💡 Common Mistakes

### ❌ Wrong: Same database for all environments
```
Local: Development DB
Preview: Development DB  ← WRONG!
Production: Production DB
```

### ✅ Correct: Development separate, Preview/Prod share
```
Local: Development DB     ← Separate for safety
Preview: Production DB    ← Share production DB
Production: Production DB ← Share production DB
```

**Why?** 
- Preview tests against real production schema
- Development stays isolated for experiments
- Production is the source of truth

---

## 🎓 Understanding the Flow

### When you develop locally:
```
Your Code → .env.local → Neon Development DB
```

### When you push to a branch:
```
Your Code → Git Push → Vercel Preview Build → Vercel Env Vars (Preview) → Neon Production DB
```

### When you push to main:
```
Your Code → Git Push → Vercel Production Build → Vercel Env Vars (Production) → Neon Production DB
```

---

## 🆘 Need Help?

If you're still having issues, share:

1. **Screenshot** of your Vercel Environment Variables page
2. **Error messages** from Vercel deployment logs
3. **Which page** is failing (e.g., /create-with-photo)

I can help debug the specific issue!

---

**Next Step**: Set up those Vercel environment variables and let me know if you need help with any step! 🚀
