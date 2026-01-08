# Preview-First Deployment Workflow

**Goal**: Deploy to preview → Test → Promote to production

---

## 1. Vercel Settings Configuration

### Go to Vercel Dashboard:
`https://vercel.com/rgriola/fotolokashen/settings/git`

### Configure These Settings:

#### **Production Branch**
- Set to: `production` (NOT `main`)
- This prevents auto-deploy to production

#### **Preview Deployments**
- ✅ Enable: "All branches"
- This auto-deploys every branch to preview

#### **Ignored Build Step** (Optional)
- Leave empty for now
- Can add conditions later if needed

---

## 2. Your New Workflow

### Step 1: Work on Main Branch (Preview)

```bash
# Make your changes on main
git add -A
git commit -m "Mobile menu improvements"
git push origin main

# ✅ Vercel auto-deploys to PREVIEW
# URL: fotolokashen-git-main-rgriola.vercel.app
```

### Step 2: Test Preview

```bash
# Visit preview URL
# Test all changes
# Verify everything works
```

### Step 3: Promote to Production

**Option A: Via Vercel Dashboard** (Recommended)
1. Go to: `https://vercel.com/rgriola/fotolokashen/deployments`
2. Find your preview deployment
3. Click **"⋯"** (three dots)
4. Click **"Promote to Production"**
5. Confirm

**Option B: Via Git** (Merge to production branch)
```bash
# Merge main into production
git checkout production
git merge main
git push origin production

# ✅ Vercel auto-deploys to PRODUCTION
# URL: fotolokashen.com
```

---

## 3. Branch Structure

```
main (preview branch)
  ├─ Push here for preview deployments
  └─ Preview URL: fotolokashen-git-main-rgriola.vercel.app

production (production branch)
  ├─ Merge main here for production
  └─ Production URL: fotolokashen.com
```

---

## 4. Setup Instructions

### Create Production Branch (One-Time Setup)

```bash
# Create production branch from current main
git checkout -b production
git push origin production

# Go back to main for development
git checkout main
```

### Update Vercel Settings

1. **Go to**: https://vercel.com/rgriola/fotolokashen/settings/git
2. **Production Branch**: Change from `main` to `production`
3. **Save**

### Verify Setup

```bash
# Test preview deployment
echo "# Test" >> README.md
git add README.md
git commit -m "Test preview"
git push origin main

# Check Vercel dashboard - should create preview, NOT production
```

---

## 5. Daily Workflow

### Making Changes:

```bash
# 1. Work on main
git checkout main
git pull origin main

# 2. Make changes
# ... edit files ...

# 3. Commit and push (creates preview)
git add -A
git commit -m "Your changes"
git push origin main

# ✅ Preview deployed automatically
```

### Testing Preview:

```bash
# Visit preview URL (from Vercel dashboard or GitHub)
# Test thoroughly
```

### Promoting to Production:

```bash
# Option 1: Dashboard (easiest)
# Go to Vercel → Deployments → Click "Promote to Production"

# Option 2: Git merge
git checkout production
git pull origin production
git merge main
git push origin production

# ✅ Production deployed automatically
```

---

## 6. Preview URLs

Vercel creates preview URLs automatically:

### Main Branch:
```
https://fotolokashen-git-main-rgriola.vercel.app
```

### Feature Branches:
```
https://fotolokashen-git-feature-name-rgriola.vercel.app
```

### Pull Requests:
```
https://fotolokashen-pr-123-rgriola.vercel.app
```

---

## 7. Alternative: Use Pull Requests

### Even Better Workflow:

```bash
# 1. Create feature branch
git checkout -b feature/mobile-menu
git push origin feature/mobile-menu

# ✅ Preview: fotolokashen-git-feature-mobile-menu-rgriola.vercel.app

# 2. Create Pull Request on GitHub
# - PR from feature/mobile-menu → main
# - Vercel adds preview URL to PR

# 3. Test preview from PR

# 4. Merge PR to main
# - Creates new preview on main

# 5. Promote main preview to production
# - Use Vercel dashboard "Promote to Production"
```

---

## 8. Quick Reference

### Commands:

```bash
# Deploy to preview (main branch)
git push origin main

# Deploy to production (production branch)
git checkout production
git merge main
git push origin production

# Create feature preview
git checkout -b feature/name
git push origin feature/name
```

### URLs:

- **Production**: `fotolokashen.com`
- **Main Preview**: `fotolokashen-git-main-rgriola.vercel.app`
- **Feature Preview**: `fotolokashen-git-[branch]-rgriola.vercel.app`

---

## 9. Vercel Dashboard Actions

### Promote Preview to Production:

1. Go to: https://vercel.com/rgriola/fotolokashen/deployments
2. Find your preview deployment
3. Click **"⋯"** menu
4. Select **"Promote to Production"**
5. Confirm

### Rollback Production:

1. Go to: https://vercel.com/rgriola/fotolokashen/deployments
2. Find previous production deployment
3. Click **"⋯"** menu
4. Select **"Promote to Production"**

---

## 10. Current Deployment

**Your latest push** (`82704d9`) is on `main`:

### To Deploy to Preview:
- Already done! (if Git integration is enabled)
- Check: https://vercel.com/rgriola/fotolokashen/deployments

### To Deploy to Production:
1. Test preview first
2. Then promote via dashboard OR
3. Merge to production branch

---

## Summary

✅ **Main branch** → Auto-deploys to **preview**  
✅ **Production branch** → Auto-deploys to **production**  
✅ **Feature branches** → Auto-deploy to **preview URLs**  
✅ **Promote** → Click button in Vercel dashboard  

**No CLI needed!** Everything via Git + Vercel dashboard. 🚀
