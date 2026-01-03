# Vercel Production Issues - Resolution Plan

**Created**: December 28, 2025  
**Status**: 🔴 CRITICAL - Production Issues Identified  
**Affected Pages**: `/create-with-photo`, `/locations`

---

## 🚨 Executive Summary

Two critical issues are preventing proper functionality in Vercel production:

1. **exifr Library Failure** - Photo upload with GPS extraction fails in production
2. **Locations Page Loading** - `/locations` page may fail to load or render properly

**Root Cause**: Differences between local development and Vercel's serverless/edge runtime environment.

---

## 📊 Issue #1: exifr Library Errors

### Problem
The `exifr` library (v7.1.3) used for extracting GPS/EXIF metadata from photos has Node.js dependencies that fail in Vercel's production environment.

### Technical Details
- **File**: `src/lib/photo-utils.ts` (line 43)
- **Method**: Client-side dynamic import: `await import('exifr')`
- **Dependencies**: `exifr` optionally requires `jsdom`, `Buffer`, `fs` - not available in browser
- **Works locally**: Development webpack is more permissive
- **Fails in Vercel**: Production bundles are tree-shaken, serverless environment lacks Node.js APIs

### Evidence
```typescript
// Current implementation (PROBLEMATIC)
const exifr = await import('exifr');
const parse = exifr.default ? exifr.default.parse : exifr.parse;
```

### Impact
- ❌ Photo upload with GPS feature completely broken
- ❌ `/create-with-photo` page unusable
- ❌ Users cannot create locations from photos
- ✅ Manual location creation still works

---

## 📊 Issue #2: /locations Page Loading

### Problem
The `/locations` page fails to load or render properly in production, likely due to Google Maps API initialization issues.

### Technical Details
- **File**: `src/app/locations/page.tsx`
- **Dependencies**: 
  - `@react-google-maps/api` with `useLoadScript`
  - `LocationsMapView` component
  - `GoogleMapsProvider` context
- **Possible causes**:
  1. Missing/incorrect `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in Vercel
  2. Race condition: Map components render before API loads
  3. Hydration mismatch between server and client
  4. CSP headers blocking Google Maps scripts

### Evidence
```tsx
// Current implementation
"use client";
// ... uses useLocations hook
// ... renders 3 tabs: grid, list, map
// Map tab may try to render before Google Maps is ready
```

### Impact
- ❌ Main locations page inaccessible
- ❌ Users cannot view saved locations
- ❌ Grid/List/Map views may all fail
- ✅ Map page (`/map`) may still work

---

## 🛠️ Solution Plan

### Phase 1: Emergency Diagnostics (DO FIRST) ⚡

**Action Items**:
1. ✅ Check Vercel dashboard → Build logs for exifr errors
2. ✅ Check Vercel dashboard → Runtime logs for 500/404 errors
3. ✅ Verify environment variables are set correctly
4. ✅ Test in Vercel preview deployment (see setup guide below)
5. ✅ Collect actual error messages/stack traces

**Environment Variables to Verify**:
```bash
# Required in Vercel
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-key>
DATABASE_URL=<production-mysql-url>
JWT_SECRET=<32-char-secret>
IMAGEKIT_PRIVATE_KEY=<your-key>
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<your-key>
IMAGEKIT_URL_ENDPOINT=<your-endpoint>
EMAIL_SERVICE=resend
EMAIL_API_KEY=<resend-key>
```

---

### Phase 2: exifr Fix (Option A - RECOMMENDED) 🎯

**Strategy**: Move EXIF extraction to server-side API route

**Why This Works**:
- Server-side has full Node.js environment
- No browser bundle issues
- More secure (file processing on server)
- Better error handling

**Implementation Steps**:

1. **Create API Route** - `src/app/api/extract-exif/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractPhotoGPS } from '@/lib/photo-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Extract EXIF data server-side
    const metadata = await extractPhotoGPS(file);
    
    return NextResponse.json({ metadata });
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract EXIF data' },
      { status: 500 }
    );
  }
}
```

2. **Update PhotoUploadWithGPS Component**:
```typescript
// Replace direct import with API call
const handleFileSelect = async (selectedFile: File) => {
  // ... validation ...
  
  setIsProcessing(true);
  try {
    // Send to API route instead of client-side processing
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const response = await fetch('/api/extract-exif', {
      method: 'POST',
      body: formData,
    });
    
    const { metadata } = await response.json();
    setGpsData(metadata);
    
    // If GPS found, reverse geocode
    if (metadata.hasGPS && metadata.lat && metadata.lng) {
      const address = await reverseGeocodeGPS(metadata.lat, metadata.lng);
      setAddressData(address);
    }
  } catch (err) {
    console.error('Error processing photo:', err);
    setError('Failed to process photo. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

3. **Update next.config.ts** (ensure exifr works server-side):
```typescript
experimental: {
  serverComponentsExternalPackages: ['exifr'],
}
```

**Estimated Effort**: 2-3 hours  
**Risk**: Low - Clean separation of concerns  
**Testing**: Easy to rollback

---

### Phase 2: exifr Fix (Option B - ALTERNATIVE) 🔄

**Strategy**: Replace `exifr` with browser-native library

**Options**:
- **exif-js**: Pure JavaScript, works in browser, smaller bundle
- **piexifjs**: Another browser-friendly option
- **ts-exif-parser**: TypeScript-friendly

**Implementation**:
```bash
npm uninstall exifr
npm install exif-js
```

```typescript
// Replace in photo-utils.ts
import EXIF from 'exif-js';

export async function extractPhotoGPS(file: File): Promise<PhotoMetadata> {
  return new Promise((resolve, reject) => {
    EXIF.getData(file as any, function(this: any) {
      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      // ... process data
      resolve({ hasGPS: !!(lat && lng), lat, lng });
    });
  });
}
```

**Pros**: Quick fix, no API changes  
**Cons**: May have fewer features than exifr  
**Estimated Effort**: 1-2 hours

---

### Phase 3: /locations Page Fix 🗺️

**Implementation Steps**:

1. **Verify Environment Variables in Vercel**:
   - Go to Vercel dashboard → Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
   - Ensure it has the same value in all environments (Production, Preview, Development)

2. **Add Error Boundary**:
```tsx
// Create src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

3. **Update LocationsMapView with Defensive Checks**:
```tsx
export function LocationsMapView({ locations }: LocationsMapViewProps) {
  const { isLoaded } = useGoogleMaps();
  
  // Don't render map until Google Maps is loaded
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }
  
  // Check if google.maps is actually available
  if (typeof window === 'undefined' || !window.google?.maps) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-destructive">
          <p>Failed to load Google Maps</p>
          <p className="text-sm">Please refresh the page</p>
        </div>
      </div>
    );
  }
  
  // ... rest of component
}
```

4. **Update locations/page.tsx**:
```tsx
{/* Map View - only render when loaded */}
<TabsContent value="map" className="mt-0">
  <ErrorBoundary 
    fallback={
      <div className="text-center p-8">
        <p>Error loading map. Please try refreshing.</p>
      </div>
    }
  >
    <LocationsMapView locations={filteredLocations} />
  </ErrorBoundary>
</TabsContent>
```

**Estimated Effort**: 1-2 hours  
**Risk**: Very low - only adds safety checks

---

### Phase 4: Code Cleanup 🧹

**Remove Debug Logging** (production performance issue):

```typescript
// In photo-utils.ts, remove/comment out lines 34-152
// All console.log, console.warn, console.error statements
// Keep only critical error logging for Sentry
```

**Why**:
- Excessive logging fills Vercel logs (costs money)
- Slows down production performance
- Exposes internal logic in browser console
- Should use Sentry for error tracking instead

**Estimated Effort**: 30 minutes

---

### Phase 5: Enhanced Monitoring 📊

**Add Sentry Error Capture**:

```typescript
// In photo-utils.ts
import * as Sentry from '@sentry/nextjs';

export async function extractPhotoGPS(file: File): Promise<PhotoMetadata> {
  try {
    // ... existing code
  } catch (error) {
    // Capture in Sentry instead of just console.error
    Sentry.captureException(error, {
      tags: {
        feature: 'photo-gps-extraction',
        fileName: file.name,
        fileSize: file.size,
      },
    });
    
    return { hasGPS: false, lat: 0, lng: 0 };
  }
}
```

**Create Health Check Endpoint**:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: await checkDatabase(),
      googleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      imagekit: !!process.env.IMAGEKIT_PRIVATE_KEY,
    },
  };
  
  return NextResponse.json(health);
}
```

---

## 📋 Action Checklist

### Immediate (Day 1)
- [ ] Check Vercel build logs
- [ ] Check Vercel runtime logs  
- [ ] Verify all environment variables
- [ ] Set up Vercel preview deployment
- [ ] Reproduce errors in preview
- [ ] Document exact error messages

### Short-term (Days 2-3)
- [ ] Implement exifr fix (Option A or B)
- [ ] Add error boundary to /locations
- [ ] Add defensive checks to LocationsMapView
- [ ] Remove debug console.logs
- [ ] Test thoroughly in preview

### Medium-term (Week 1)
- [ ] Add Sentry error capture
- [ ] Create health check endpoint
- [ ] Set up Vercel Analytics
- [ ] Monitor production errors
- [ ] Create runbook for common issues

---

## 🧪 Testing Strategy

### Local Testing
```bash
# Test with production build locally
npm run build
npm run start

# Navigate to:
# - http://localhost:3000/create-with-photo
# - http://localhost:3000/locations
```

### Preview Deployment Testing
1. Push to feature branch
2. Vercel auto-creates preview
3. Test all affected pages
4. Check preview logs
5. Verify environment variables

### Production Testing
1. Deploy to production
2. Monitor Sentry for errors
3. Test critical user flows
4. Have rollback plan ready

---

## 🔍 Environment Differences

### Local Development
- ✅ Full Node.js environment
- ✅ Permissive webpack bundling
- ✅ Hot reload/fast refresh
- ⚠️ Using PRODUCTION database (risky!)
- ⚠️ May mask production issues

### Vercel Production
- ❌ Serverless/Edge runtime (limited Node.js)
- ❌ Aggressive tree-shaking
- ❌ No hot reload
- ✅ Production database
- ✅ Real-world conditions

### Key Differences
| Aspect | Local Dev | Vercel Production |
|--------|-----------|-------------------|
| Node.js APIs | Full access | Limited (serverless) |
| Bundle size | Larger | Optimized/minimal |
| Error visibility | Console | Logs dashboard |
| Database | Production (not ideal) | Production |
| Build time | Fast (dev) | Slower (optimized) |

---

## 🚀 Deployment Plan

### Phase 1: Fix & Test
1. Implement fixes on feature branch
2. Push to trigger preview deployment
3. Test thoroughly in preview
4. Get approval

### Phase 2: Staged Rollout
1. Merge to main (auto-deploys to production)
2. Monitor Sentry closely (15 min)
3. Test critical flows manually
4. Monitor Vercel analytics

### Phase 3: Rollback Plan
If issues occur:
```bash
# Option 1: Revert in Vercel dashboard
# Settings → Deployments → Previous deployment → Promote to Production

# Option 2: Git revert
git revert HEAD
git push origin main
```

---

## 📚 Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [exifr Documentation](https://github.com/MikeKovarik/exifr)
- [Google Maps API Setup](https://developers.google.com/maps/documentation/javascript/get-api-key)

---

## 💡 Prevention for Future

### Development Best Practices
1. ✅ Always test with `npm run build && npm run start` before deploying
2. ✅ Use separate development database (not production!)
3. ✅ Test in Vercel preview before merging
4. ✅ Set up staging environment
5. ✅ Use feature flags for new features

### Architecture Improvements
1. ✅ Move all Node.js-dependent code to API routes
2. ✅ Add comprehensive error boundaries
3. ✅ Implement health checks
4. ✅ Set up proper monitoring (Sentry, Vercel Analytics)
5. ✅ Create E2E tests for critical flows

---

## 📞 Next Steps

1. **Review this document** - Understand the issues and solutions
2. **Set up Vercel preview** - Follow guide below
3. **Reproduce errors** - Document exact error messages
4. **Choose solution approach** - Option A (API route) vs Option B (library swap)
5. **Implement fixes** - Start with Phase 1 diagnostics
6. **Test thoroughly** - Use preview deployment
7. **Deploy to production** - Monitor closely

---

**Status**: 🔴 Ready for Implementation  
**Owner**: Development Team  
**Priority**: P0 - Critical Production Issues  
**Last Updated**: December 28, 2025
