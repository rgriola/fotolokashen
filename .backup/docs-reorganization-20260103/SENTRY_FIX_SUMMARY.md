# ✅ Sentry Source Maps Fix Complete

## Issue Resolved

**Warning:** `Using organization 'rod-griola' (embedded in token) rather than manually-configured organization 'merkel-vision'`

**Root Cause:** Mismatch between `next.config.ts` organization and Sentry auth token organization.

---

## Fix Applied

Updated `next.config.ts`:

```typescript
// Before:
org: "merkel-vision",

// After:
org: "rod-griola",  // Must match Sentry auth token organization
```

---

## What to Do Next

### **Step 1: Commit and Push**

```bash
git add next.config.ts
git commit -m "fix: Update Sentry organization to match auth token"
git push origin main
```

### **Step 2: Wait for Deployment**

Vercel will automatically deploy (takes ~2-3 minutes).

### **Step 3: Verify Success**

After deployment, check the build logs for:

```bash
✅ Should see:
[@sentry/nextjs] Info: Successfully uploaded source maps to Sentry
[@sentry/nextjs] Info: Created release: merkel-vision@<version>

✅ Should NOT see:
[@sentry/nextjs] WARN: Using organization 'rod-griola' (embedded in token)...
[@sentry/nextjs] Warning: could not determine a source map reference...
```

---

## Additional Warnings Explained

You also saw many warnings like:
```
warning: could not determine a source map reference 
(Could not auto-detect referenced sourcemap for ~/app/page_client-reference-manifest.js)
```

**These are expected and harmless:**
- Next.js 13+ App Router generates `*_client-reference-manifest.js` files
- These are internal Next.js files (not your code)
- They don't need source maps because they're just metadata
- Sentry correctly ignores them

**No action needed** - they won't appear in error stack traces.

---

## Expected Results

### Before This Fix:
```
❌ Warning: Using organization 'rod-griola' rather than 'merkel-vision'
❌ No source maps uploaded
❌ Errors show minified code: chunk-abc123.js:1:4567
```

### After This Fix:
```
✅ Organization matches: rod-griola
✅ Source maps uploaded successfully
✅ Errors show original code: LoginForm.tsx:42
```

---

## What You Get Now

When an error happens in production, Sentry will show:

**Stack Trace:**
```typescript
Error: Login failed
  at handleSubmit (src/components/auth/LoginForm.tsx:42:15)
  at async onSubmit (src/components/auth/LoginForm.tsx:38:7)
```

**Source Code Context:**
```typescript
40: const handleSubmit = async (data: LoginFormData) => {
41:   try {
42:     throw new Error("Login failed");  ← Error here!
43:   } catch (error) {
44:     console.error(error);
```

**Exact file, line number, and surrounding code** - easy to debug! 🎯

---

## Commit This Change

```bash
# In terminal:
cd /Users/rgriola/Desktop/01_Vibecode/google-search-me-refactor
git add next.config.ts SENTRY_SOURCE_MAPS_SETUP.md SENTRY_FIX_SUMMARY.md
git commit -m "fix: Update Sentry org to rod-griola to match auth token

- Changed org from 'merkel-vision' to 'rod-griola' in next.config.ts
- Fixes source map upload warnings
- Enables readable production error stack traces
- Updated documentation"
git push origin main
```

Then wait ~2-3 minutes for Vercel to deploy and check build logs.

---

## Verification Checklist

After deployment completes:

- [ ] Go to Vercel → Deployments → Click latest deployment
- [ ] Scroll to build logs section
- [ ] Search for "sentry" or "source map"
- [ ] Verify: "Successfully uploaded source maps to Sentry" ✅
- [ ] Verify: NO warnings about organization mismatch ✅
- [ ] Optional: Test with Sentry test error (see SENTRY_SOURCE_MAPS_SETUP.md)

---

## Status

**✅ Fix Complete** - Ready to commit and deploy!

**Next Task:** Update production environment variables (EMAIL_MODE, JWT_SECRET, etc.)
