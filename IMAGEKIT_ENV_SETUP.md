# ImageKit URL Configuration - Vercel Setup

## ✅ What We Just Fixed

Changed the ImageKit URL endpoint from hardcoded to environment variable configurable.

### Before:
```typescript
export const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/rgriola';
```

### After:
```typescript
export const IMAGEKIT_URL_ENDPOINT = 
    process.env.IMAGEKIT_URL_ENDPOINT || 
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 
    'https://ik.imagekit.io/rgriola';
```

---

## 🚀 Vercel Environment Variable Setup

### Option 1: Add via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your `fotolokashen` project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:

```
Name: IMAGEKIT_URL_ENDPOINT
Value: https://ik.imagekit.io/rgriola
Environment: Production, Preview, Development (select all)
```

6. Click **Save**
7. **Redeploy** your app for changes to take effect:
   - Go to **Deployments**
   - Click the ⋯ menu on the latest deployment
   - Click **Redeploy**

### Option 2: Add via Vercel CLI

```bash
cd /Users/rgriola/Desktop/01_Vibecode/fotolokashen

# Add to production
vercel env add IMAGEKIT_URL_ENDPOINT production
# When prompted, enter: https://ik.imagekit.io/rgriola

# Add to preview
vercel env add IMAGEKIT_URL_ENDPOINT preview
# When prompted, enter: https://ik.imagekit.io/rgriola

# Add to development
vercel env add IMAGEKIT_URL_ENDPOINT development
# When prompted, enter: https://ik.imagekit.io/rgriola

# Redeploy
vercel --prod
```

---

## 📋 Current Environment Variables

Your `.env.local` already has:
```bash
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/rgriola"
```

So **local development works immediately** ✅

---

## 🎯 Benefits

1. **Easy to change**: Update env var instead of code
2. **Environment-specific**: Different ImageKit accounts per environment
3. **No code changes**: Just update Vercel settings
4. **Backward compatible**: Falls back to rgriola endpoint if not set

---

## ⚠️ Important Notes

- The code change is **backward compatible** - it will work even without the env var
- Local development already works (`.env.local` has the variable)
- **Production needs the env var added to Vercel** for best practice
- After adding to Vercel, **redeploy** for it to take effect

---

## ✅ Verification

After deploying, verify it's working:

1. Check Vercel deployment logs
2. Look for: `IMAGEKIT_URL_ENDPOINT` in the build logs
3. Test photo upload from iOS app
4. Check ImageKit dashboard for new uploads

---

**Status**: ✅ Code committed and pushed  
**Next**: Add env var to Vercel (optional but recommended)  
**Impact**: None if skipped (fallback works)

---

![Uploaded Image](https://ik.imagekit.io/rgriola/production/users/4/photos/photo_1768588473263_CoTZL1Lsmb.jpg)
