# 🔍 Sentry Source Maps Setup Guide

## What You're Seeing

The warning in your Vercel deployment logs:
```
[@sentry/nextjs] Warning: No auth token provided. Will not upload source maps.
```

**Status:** ⚠️ Sentry is working for error tracking, but you're missing source maps.

---

## What Are Source Maps? 🗺️

When Next.js builds for production, it minifies your code:

**Your Code:**
```typescript
// src/components/auth/LoginForm.tsx:42
const handleSubmit = async (data: LoginFormData) => {
  throw new Error("Login failed");
};
```

**Production Code (Minified):**
```javascript
// chunk-abc123.js:1:4567
const h=async(d)=>{throw new Error("Login failed")};
```

### Without Source Maps:
Sentry shows:
```
❌ Error at chunk-abc123.js:1:4567
   at h (chunk-abc123.js:1:4567)
```
**Impossible to debug!** You don't know which file or line.

### With Source Maps:
Sentry shows:
```
✅ Error at src/components/auth/LoginForm.tsx:42
   at handleSubmit (LoginForm.tsx:42)
```
**Easy to debug!** You know exactly where the error happened.

---

## Quick Fix (10 Minutes)

### **Step 1: Add Sentry Auth Token to Vercel**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project: `merkel-vision`

2. **Add Environment Variable:**
   - Click **Settings** → **Environment Variables**
   - Click **Add New**
   
3. **Enter Details:**
   ```bash
   Name:  SENTRY_AUTH_TOKEN
   Value: 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
   ```

4. **Set Environment:**
   - ✅ Check **Production** only
   - ❌ Uncheck Preview and Development
   
5. **Click Save**

### **Step 2: Verify Sentry Organization/Project Names**

Your `next.config.ts` has been updated to:
```typescript
org: "rod-griola",  // Your Sentry organization
project: "merkel-vision",
```

**This matches your Sentry auth token organization.**

If you ever need to verify:
1. Go to https://sentry.io
2. Check the URL when viewing your project:
   - Should be: `https://sentry.io/organizations/rod-griola/projects/merkel-vision/`

**✅ Already configured correctly!**

### **Step 3: Redeploy**

1. Go to Vercel → **Deployments** tab
2. Click **⋮** (three dots) on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger deployment

### **Step 4: Verify It Worked**

After deployment completes, check the build logs:
```bash
✅ Should see:
[@sentry/nextjs] Info: Successfully uploaded source maps to Sentry
[@sentry/nextjs] Info: Created release: merkel-vision@<version>

❌ Should NOT see:
[@sentry/nextjs] Warning: No auth token provided
```

---

## If Sentry Org Name Changes

If you ever need to change the organization (unlikely), update `next.config.ts`:

**Example:**
```typescript
export default withSentryConfig(nextConfig, {
  org: "your-org-name",  // ← Must match your Sentry auth token
  project: "merkel-vision",
  // ...
});
```

**Note:** Your current setup is already correct (`rod-griola` organization).

---

## What You Get With Source Maps ✅

### Before (No Source Maps):
```
Error: Login failed
  at h (chunk-abc123.js:1:4567)
  at async f (chunk-def456.js:2:890)
```
**Useless** - Can't tell which file or function.

### After (With Source Maps):
```
Error: Login failed
  at handleSubmit (src/components/auth/LoginForm.tsx:42)
  at async onSubmit (src/components/auth/LoginForm.tsx:38)
```
**Useful** - Exact file, line, and function name!

### Plus:
- 🎯 **Precise error locations** in original TypeScript
- 📊 **Release tracking** - Know which deployment caused errors
- 🔍 **Better stack traces** - See actual variable names
- 📈 **Deployment monitoring** - Track error rates per release

---

## Troubleshooting

### "Invalid auth token"
1. Go to Sentry → **Settings** → **Auth Tokens**
2. Click **Create New Token**
3. Name: `Vercel Source Maps`
4. Scopes:
   - ✅ `project:releases`
   - ✅ `project:write`
   - ✅ `org:read`
5. Copy new token
6. Update `SENTRY_AUTH_TOKEN` in Vercel

### "Organization not found"
1. Check your Sentry dashboard URL
2. Update `org:` in `next.config.ts` to match
3. Redeploy

### "Project not found"
1. Verify project exists in Sentry
2. Check `project:` in `next.config.ts` matches exactly
3. Case-sensitive! `merkel-vision` ≠ `Merkel-Vision`

### "Build takes longer now"
Source map upload adds ~10-20 seconds to build time. This is normal and worth it for better debugging.

---

## Testing Source Maps Work

### 1. Trigger a Test Error

Add this to any page (temporarily):
```typescript
// In src/app/map/page.tsx (top of component)
if (typeof window !== 'undefined') {
  console.log('Testing Sentry source maps');
  // Trigger test error in 5 seconds
  setTimeout(() => {
    throw new Error('Sentry source map test - DELETE THIS');
  }, 5000);
}
```

### 2. Visit the Page in Production
- Go to https://merkelvision.com/map
- Wait 5 seconds
- Error will be thrown

### 3. Check Sentry Dashboard
- Go to https://sentry.io
- Click **Issues**
- Find error: "Sentry source map test"
- Click to view details

### 4. Verify Source Maps
You should see:
```
✅ GOOD (with source maps):
Error: Sentry source map test - DELETE THIS
  at Timeout._onTimeout (src/app/map/page.tsx:12)
  at listOnTimeout (node:internal/timers:559:17)
```

NOT:
```
❌ BAD (no source maps):
Error: Sentry source map test - DELETE THIS
  at Timeout._onTimeout (chunk-abc123.js:1:4567)
```

### 5. Remove Test Code
Delete the test code from `page.tsx` and redeploy.

---

## Cost & Performance

| Feature | Free Tier | Impact |
|---------|-----------|--------|
| **Error Tracking** | 5k events/mo | Already using ✅ |
| **Source Maps** | Unlimited | +10-20s build time |
| **Release Tracking** | Unlimited | No impact |
| **Performance Monitoring** | 10k transactions/mo | Not enabled |

**Source maps are free and highly recommended for production debugging.**

---

## Summary

**What to do NOW:**
1. ✅ Add `SENTRY_AUTH_TOKEN` to Vercel environment variables
2. ✅ Verify Sentry org name matches `next.config.ts`
3. ✅ Redeploy
4. ✅ Check build logs for success message

**Time:** 10 minutes  
**Cost:** Free  
**Benefit:** Readable error stack traces in production

**Without this:** You'll waste hours debugging minified errors.  
**With this:** You'll know exactly which line caused the error.

---

## Next Steps

After source maps are working:

### Optional: Enable Performance Monitoring
Tracks page load times, API response times, database queries.

Add to Vercel environment variables:
```bash
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1  # Track 10% of requests
```

### Optional: Enable Session Replay
Records user sessions when errors occur (like a video replay).

```typescript
// In sentry.client.config.ts
Sentry.init({
  // ...existing config
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% when error occurs
});
```

**Free tier:** 50 replays/month (enough for debugging critical issues)

---

## Support

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Source Maps:** https://docs.sentry.io/platforms/javascript/sourcemaps/
- **Auth Tokens:** https://docs.sentry.io/api/auth/

**Questions?** Check your Sentry dashboard or reach out to support@sentry.io.
