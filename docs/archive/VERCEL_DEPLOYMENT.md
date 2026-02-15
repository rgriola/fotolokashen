# Vercel Deployment Workflow

## Current Setup (Manual CLI) - DEPRECATED ⚠️

```bash
git push
npx vercel --prod  # ← Vercel is deprecating this
```

# 1. Create a feature branch
git checkout -b feature/my-new-feature

# 2. Make changes and push
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature

# 3. Vercel automatically deploys to:
# https://fotolokashen-git-feature-my-new-feature-rgriola.vercel.app


# Create a test branch
git checkout -b test/preview-deployment

# Make a small change (like updating README)
echo "Testing preview deployment" >> README.md

# Push to trigger preview
git add README.md
git commit -m "Test: Preview deployment"
git push origin test/preview-deployment

---

## Recommended Setup (Git Integration) ✅

### 1. Enable Git Integration in Vercel

**Steps:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your `fotolokashen` project
3. Go to **Settings** → **Git**
4. Ensure GitHub integration is connected
5. Set **Production Branch**: `main`

### 2. Configure Auto-Deploy

**In Vercel Project Settings:**

- ✅ **Production Branch**: `main`
  - Every push to `main` → Production deployment
  
- ✅ **Preview Deployments**: All branches
  - Every push to any branch → Preview deployment
  
- ✅ **Deploy Hooks**: (Optional)
  - For manual triggers

### 3. New Workflow

#### For Production:
```bash
git add -A
git commit -m "Your changes"
git push origin main
# Vercel automatically deploys to fotolokashen.com
```

#### For Preview/Testing:
```bash
git checkout -b feature/new-feature
git add -A
git commit -m "Testing new feature"
git push origin feature/new-feature
# Vercel creates preview: fotolokashen-git-feature-new-feature-rgriola.vercel.app
```

#### For Manual Production Deploy:
```bash
# Option 1: Use Vercel Dashboard
# Go to vercel.com → fotolokashen → Deployments → Redeploy

# Option 2: Use Deploy Hook (if configured)
curl -X POST https://api.vercel.com/v1/integrations/deploy/...
```

---

## Benefits of Git Integration

✅ **Automatic** - No manual commands  
✅ **Preview URLs** - Every branch gets a URL  
✅ **Rollbacks** - Easy to revert in dashboard  
✅ **CI/CD** - Proper deployment pipeline  
✅ **Team-friendly** - Everyone can deploy  
✅ **Audit trail** - See who deployed what  

---

## Migration Steps

### Step 1: Verify Git Integration

Check if already connected:
```bash
# In Vercel dashboard:
# Settings → Git → Should show: github.com/rgriola/fotolokashen
```

### Step 2: Test Auto-Deploy

```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "Test auto-deploy"
git push origin main

# Watch Vercel dashboard - should auto-deploy
```

### Step 3: Remove CLI Dependency

Once confirmed working:
```bash
# You can stop using:
npx vercel --prod

# Just use:
git push
```

---

## For Your Current Deployment

Since you just pushed to `main`, check your Vercel dashboard:
- It may have already auto-deployed
- If not, enable Git integration first

---

## Quick Check

**Is Git integration enabled?**

1. Go to: https://vercel.com/rgriola/fotolokashen/settings/git
2. Should show: "Connected to github.com/rgriola/fotolokashen"
3. Production Branch: `main`

If not connected, click **Connect Git Repository** and select your repo.

---

## Alternative: Deploy Hooks (For Manual Control)

If you want manual control but not CLI:

1. **Create Deploy Hook**:
   - Vercel Dashboard → Settings → Git → Deploy Hooks
   - Name: "Manual Production Deploy"
   - Branch: `main`
   - Copy the hook URL

2. **Deploy with Hook**:
   ```bash
   # Save hook URL to .env.local (don't commit)
   VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
   
   # Deploy with:
   curl -X POST $VERCEL_DEPLOY_HOOK
   ```

3. **Or create npm script**:
   ```json
   // package.json
   {
     "scripts": {
       "deploy": "curl -X POST $VERCEL_DEPLOY_HOOK"
     }
   }
   ```
   
   Then: `npm run deploy`

---

**Recommendation**: Enable Git integration and use `git push` for deployments. It's the modern, supported way! 🚀
