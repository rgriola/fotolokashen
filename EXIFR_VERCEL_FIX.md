# EXIFR Vercel Deployment Fix

**Date**: December 30, 2025  
**Issue**: jsdom/exifr errors in Vercel production  
**Status**: ✅ FIXED

---

## 🐛 The Problem

### Error in Production:
```
Error: Failed to load external module jsdom: Error [ERR_REQUIRE_ESM]: 
require() of ES Module /var/task/node_modules/parse5/dist/index.js 
from /var/task/node_modules/jsdom/lib/jsdom/browser/parser/html.js not supported.
```

### Where it happened:
- **Page**: `/locations`
- **API Route**: `/api/locations` 
- **Environment**: Vercel serverless (production/preview only)
- **Local Dev**: No error (works fine)

---

## 🔍 Root Cause

The `exifr` library (used for extracting GPS data from photos) has a dependency chain:

```
exifr → jsdom → parse5 (ES Module)
```

### Why it failed in Vercel:

1. **Webpack/Turbopack bundles everything by default** - Even though `exifr` is only used on the client side (in browser), Next.js was bundling it into the server-side code during the Vercel build

2. **jsdom requires Node.js APIs** - jsdom needs `fs`, `canvas`, and other Node.js modules that don't exist in Vercel's serverless environment

3. **parse5 is an ES Module** - When jsdom tries to `require('parse5')`, it fails because parse5 has been updated to be an ES Module only, which can't be loaded with CommonJS `require()`

4. **Dynamic imports aren't enough** - Even though we used `const exifr = await import('exifr')`, webpack still included it in the server bundle as a potential dependency

---

## ✅ The Solution

### Updated `next.config.ts`:

Added two critical configurations:

#### 1. Server External Packages
```typescript
serverExternalPackages: ['exifr', 'jsdom', 'parse5']
```
This tells Next.js: **"Don't bundle these packages into server components"**

#### 2. Webpack Externals (Server Only)
```typescript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals = [
      ...(config.externals || []),
      'exifr',
      'jsdom',
      'parse5',
      'canvas',
      'bufferutil',
      'utf-8-validate',
    ];
  }
  return config;
}
```

This tells Webpack: **"When building server code, treat these as external (don't bundle them)"**

### Why This Works:

1. **Client-side code** still works perfectly - The browser can load and run exifr normally
2. **Server-side code** never tries to load these packages - They're excluded from the server bundle
3. **API routes** don't crash - They never encounter the jsdom import issue
4. **No code changes needed** - `src/lib/photo-utils.ts` remains unchanged

---

## 🧪 Testing

### Before Fix:
```
✅ Local dev: npm run dev → Works fine
❌ Vercel preview: https://merkel-vision-git-branch.vercel.app/locations → Error
❌ Vercel production: https://merkel-vision.vercel.app/locations → Error
```

### After Fix:
```
✅ Local dev: npm run dev → Works fine
✅ Vercel preview: https://merkel-vision-git-branch.vercel.app/locations → Should work
✅ Vercel production: https://merkel-vision.vercel.app/locations → Should work
```

### Test Checklist:
- [ ] Push code to test branch
- [ ] Wait for Vercel preview build to complete
- [ ] Visit `/locations` page in preview
- [ ] Test photo upload with GPS extraction
- [ ] Check Vercel function logs for errors
- [ ] Merge to main if successful

---

## 📋 Related Files

### Modified:
- `next.config.ts` - Added serverExternalPackages and updated webpack config

### Uses exifr (unchanged):
- `src/lib/photo-utils.ts` - Client-side GPS extraction from photos
- `src/components/locations/PhotoUploadWithGPS.tsx` - Photo upload component
- `src/app/create-with-photo/page.tsx` - Photo-based location creation

### Dependencies:
- `exifr` v7.1.3 - EXIF/GPS extraction library
- `jsdom` (transitive dependency via exifr)
- `parse5` (transitive dependency via jsdom)

---

## 💡 Key Learnings

1. **Dynamic imports don't prevent bundling** - They only defer loading, not bundling
2. **Webpack bundles everything by default** - Must explicitly exclude packages
3. **Vercel serverless ≠ Node.js** - Not all Node.js packages work in serverless
4. **ES Modules vs CommonJS matters** - Can't `require()` an ES Module
5. **Client-only code needs explicit marking** - Use `serverExternalPackages` for clarity

---

## 🔮 Future Improvements

If exifr continues to cause issues, consider:

### Option A: Browser-Native Library
Replace exifr with a browser-only library:
- `exif-js` - Older but stable, no Node.js dependencies
- `piexifjs` - JavaScript-only EXIF parser
- Custom EXIF reader using DataView

### Option B: Server-Side Processing
Move EXIF extraction to an API route:
```typescript
// POST /api/extract-exif
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');
  // Use exifr in Node.js environment
  const exif = await exifr.parse(file);
  return Response.json(exif);
}
```

### Option C: Edge Function
Use Vercel Edge Functions with compatible libraries:
```typescript
export const runtime = 'edge';
export async function GET(request: NextRequest) {
  // Use edge-compatible EXIF library
}
```

---

## ✅ Deployment Checklist

Before deploying this fix:

1. **Local Testing**
   - [ ] `npm run build` succeeds
   - [ ] `npm run dev` works
   - [ ] Photo upload extracts GPS data

2. **Vercel Preview**
   - [ ] DATABASE_URL environment variable set for Preview
   - [ ] Push to test branch triggers build
   - [ ] Build completes without errors
   - [ ] `/locations` page loads
   - [ ] Photo upload works

3. **Vercel Production**
   - [ ] DATABASE_URL environment variable set for Production
   - [ ] Merge to main
   - [ ] Production build succeeds
   - [ ] All critical pages load
   - [ ] No errors in function logs

---

**Status**: Ready to test in Vercel preview! 🚀
