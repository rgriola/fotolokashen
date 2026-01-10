# Photo Upload Optimization - Cache First, Then ImageKit

**Date:** January 9, 2026  
**Status:** 📋 DESIGN PHASE  
**Priority:** HIGH - Prevents Orphaned Photos

---

## 🎯 Problem

**Current Behavior:**
- User uploads photos → **Immediately uploaded to ImageKit**
- User fills out form but **abandons without saving**
- Photos remain in ImageKit → **Orphaned storage** 💰

**Impact:**
1. ❌ Wasted ImageKit storage (costs money)
2. ❌ Orphaned files accumulate over time
3. ❌ No way to track which files are abandoned
4. ❌ Poor user experience (upload wait even if they cancel)

---

## ✅ Solution

**New Behavior:**
- User uploads photos → **Stored in browser memory (Base64/Blob)**
- User fills out form and clicks **Save Location**
- Photos uploaded to ImageKit → **Saved to database**
- If user cancels → **No ImageKit upload, no orphans** ✅

---

## 🔄 Affected Components

### 1. **SaveLocationPanel** (Primary Use Case)
**File:** `src/components/panels/SaveLocationPanel.tsx`
**Current:** ImageKit upload on select
**New:** Cache in state, upload on save

### 2. **EditLocationPanel** (Add Photos to Existing Location)
**File:** `src/components/panels/EditLocationPanel.tsx`
**Current:** ImageKit upload on select
**New:** Cache in state, upload on save

### 3. **PhotoLocationForm** (/create-with-photo)
**File:** `src/components/locations/PhotoLocationForm.tsx`
**Current:** ImageKit upload on form submit
**New:** ✅ Already uploads on submit (GOOD!)

---

## 📊 Architecture Comparison

### Current Flow (Problematic)
```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects photo file                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. IMMEDIATE upload to ImageKit                            │
│    ✅ File stored in cloud                                 │
│    💰 Storage costs start                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User fills out form                                      │
│    (or abandons - photos already uploaded!)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
    ┌───────────────┐   ┌────────────────┐
    │ User Saves    │   │ User Cancels   │
    │ ✅ Photos OK  │   │ ❌ ORPHANED!   │
    └───────────────┘   └────────────────┘
```

### New Flow (Optimized)
```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects photo file                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Cache in browser (Base64/Blob/File)                    │
│    ✅ Instant preview                                       │
│    ✅ No upload yet                                         │
│    ✅ No storage costs                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User fills out form                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
    ┌───────────────┐   ┌────────────────┐
    │ User Saves    │   │ User Cancels   │
    ├───────────────┤   ├────────────────┤
    │ 4a. Upload to │   │ 4b. Clear cache│
    │  ImageKit     │   │ ✅ No orphans  │
    │ 5a. Save to DB│   │ ✅ Clean       │
    │ ✅ Success    │   └────────────────┘
    └───────────────┘
```

---

## 💾 Data Structure

### CachedPhoto Interface
```typescript
interface CachedPhoto {
    // File information
    file: File;                    // Original file object
    preview: string;               // Base64 or Object URL for preview
    
    // Metadata
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    
    // UI state
    isPrimary?: boolean;
    caption?: string;
    
    // Upload tracking
    uploading?: boolean;           // True during ImageKit upload
    uploadProgress?: number;       // 0-100
    error?: string;                // Upload error message
    
    // ImageKit response (after upload)
    imagekitFileId?: string;
    imagekitFilePath?: string;
    url?: string;
}
```

---

## 🔧 Implementation Plan

### Phase 1: Create Photo Cache Manager Hook

**File:** `src/hooks/usePhotoCacheManager.ts` (NEW)

```typescript
export function usePhotoCacheManager() {
    const [cachedPhotos, setCachedPhotos] = useState<CachedPhoto[]>([]);
    
    const addPhoto = (file: File) => {
        // Validate file
        // Generate preview (Base64 or Object URL)
        // Add to cache
    };
    
    const removePhoto = (index: number) => {
        // Remove from cache
        // Revoke Object URL if used
    };
    
    const uploadAllToImageKit = async (placeId: string) => {
        // Upload each cached photo to ImageKit
        // Return uploaded photo data
    };
    
    const clearCache = () => {
        // Revoke all Object URLs
        // Clear state
    };
    
    return {
        cachedPhotos,
        addPhoto,
        removePhoto,
        uploadAllToImageKit,
        clearCache,
    };
}
```

---

### Phase 2: Update ImageKitUploader Component

**File:** `src/components/ui/ImageKitUploader.tsx`

**Changes:**
1. Add `uploadMode` prop: `'immediate'` | `'deferred'`
2. When `deferred`, cache files instead of uploading
3. Expose `uploadCachedPhotos()` method
4. Show preview from cached files

```typescript
interface ImageKitUploaderProps {
    uploadMode?: 'immediate' | 'deferred'; // NEW
    onCachedPhotosChange?: (photos: CachedPhoto[]) => void; // NEW
    // ... existing props
}
```

---

### Phase 3: Update SaveLocationForm

**File:** `src/components/locations/SaveLocationForm.tsx`

**Changes:**
1. Accept cached photos from ImageKitUploader
2. Upload photos to ImageKit on form submit
3. Include uploaded photo data in location save

```typescript
const handleSubmit = async (data: SaveLocationFormData) => {
    // 1. Upload cached photos to ImageKit
    const uploadedPhotos = await uploadCachedPhotos();
    
    // 2. Submit location with photo data
    const submitData = {
        ...data,
        photos: uploadedPhotos,
    };
    
    await onSubmit(submitData);
};
```

---

### Phase 4: Update EditLocationForm

**File:** `src/components/locations/EditLocationForm.tsx`

**Similar changes as SaveLocationForm**

---

### Phase 5: Update API Endpoint

**File:** `src/app/api/locations/route.ts` (POST handler)

**Already accepts photos array** ✅

No changes needed if photos are uploaded before API call.

---

## 🧪 Testing Strategy

### Test Case 1: Happy Path (Save)
1. Open Save Location Panel
2. Upload 3 photos
3. Verify: Photos show in preview (from cache)
4. Fill out location form
5. Click Save
6. Verify: Photos upload to ImageKit
7. Verify: Location saved with photos
8. Verify: Photos visible in UI

### Test Case 2: Abandon (Cancel)
1. Open Save Location Panel
2. Upload 3 photos
3. Verify: Photos show in preview (from cache)
4. Click Cancel (close panel)
5. Verify: No ImageKit upload
6. Verify: No database records
7. Verify: Clean state

### Test Case 3: Edit Location (Add Photos)
1. Open existing location
2. Click Edit
3. Upload 2 new photos
4. Verify: New photos cached
5. Verify: Existing photos still shown
6. Click Save
7. Verify: Only new photos uploaded to ImageKit
8. Verify: All photos associated with location

### Test Case 4: Mobile (Large Files)
1. Select 5 large photos (>5MB each)
2. Verify: Compression applied
3. Verify: Preview shows immediately
4. Cancel before save
5. Verify: No ImageKit upload
6. Verify: Memory cleaned up

---

## 📊 Performance Considerations

### Memory Usage
- **Cached photos:** ~10-20MB for 10 photos (compressed previews)
- **Mitigation:** Use Object URLs instead of Base64 for large files
- **Cleanup:** Revoke Object URLs on unmount/cancel

### Upload Time
- **Before:** Upload starts immediately (user may abandon mid-upload)
- **After:** Upload only when user commits (faster perceived UX)
- **Tradeoff:** Slight delay on save (but user expects it)

### Browser Compatibility
- **File API:** ✅ All modern browsers
- **Object URLs:** ✅ All modern browsers
- **Base64:** ✅ All browsers (fallback)

---

## 🔒 Security Considerations

### Client-Side Validation
```typescript
const validatePhoto = (file: File) => {
    // File size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large');
    }
    
    // File type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type');
    }
    
    // Image dimensions (after load)
    // Compression (if needed)
};
```

### Server-Side Validation
- ✅ Already implemented in ImageKit upload
- ✅ Already implemented in API endpoint
- ✅ No changes needed

---

## 💰 Cost Savings

### Current (Orphaned Uploads)
```
Scenario: 100 users/day upload photos but 20% abandon

Uploads per day: 100 users × 3 photos = 300 photos
Abandons per day: 20% × 300 = 60 orphaned photos
Orphans per month: 60 × 30 = 1,800 photos
Average size: 1MB per photo
Monthly waste: 1,800 MB = 1.8 GB

ImageKit cost: $0.02/GB/month
Monthly waste cost: 1.8 × $0.02 = $0.036
Annual waste cost: $0.036 × 12 = $0.43
```

**Plus:** Cleanup effort, database bloat, confusion

### New (Cache First)
```
Orphaned uploads: 0
Monthly waste: 0 GB
Cost: $0.00
```

---

## 🚀 Rollout Plan

### Week 1: Implementation
- [ ] Create `usePhotoCacheManager` hook
- [ ] Update `ImageKitUploader` component
- [ ] Add `deferred` upload mode
- [ ] Test in isolation

### Week 2: Integration
- [ ] Update `SaveLocationForm`
- [ ] Update `EditLocationForm`
- [ ] Update `SaveLocationPanel`
- [ ] Update `EditLocationPanel`

### Week 3: Testing
- [ ] Test all forms with cache mode
- [ ] Test abandon scenarios
- [ ] Test mobile performance
- [ ] Test memory cleanup

### Week 4: Deployment
- [ ] Deploy to preview environment
- [ ] Monitor for issues
- [ ] Deploy to production
- [ ] Document new behavior

---

## 📝 Migration Notes

### Backward Compatibility
- `PhotoLocationForm` already uploads on submit ✅
- Existing locations with photos unchanged ✅
- New feature doesn't break existing code ✅

### Feature Flags (Optional)
```typescript
const USE_PHOTO_CACHE = process.env.NEXT_PUBLIC_ENABLE_PHOTO_CACHE === 'true';

<ImageKitUploader 
    uploadMode={USE_PHOTO_CACHE ? 'deferred' : 'immediate'}
/>
```

---

## 🔗 Related Files

### To Create:
- `src/hooks/usePhotoCacheManager.ts`
- `src/types/photo-cache.ts`

### To Modify:
- `src/components/ui/ImageKitUploader.tsx`
- `src/components/locations/SaveLocationForm.tsx`
- `src/components/locations/EditLocationForm.tsx`
- `src/components/panels/SaveLocationPanel.tsx`
- `src/components/panels/EditLocationPanel.tsx`

### No Changes Needed:
- `src/components/locations/PhotoLocationForm.tsx` ✅ (already deferred)
- `src/app/api/locations/route.ts` ✅ (already accepts photos array)

---

## ✅ Benefits Summary

### User Experience
- ✅ **Faster perceived upload** (no wait before form)
- ✅ **Cancel without waste** (no orphaned uploads)
- ✅ **Better mobile UX** (less data usage on abandon)

### Cost Savings
- ✅ **No orphaned ImageKit storage**
- ✅ **Lower bandwidth costs** (no uploads on abandon)
- ✅ **Cleaner database** (no orphaned photo records)

### Developer Experience
- ✅ **Clearer separation of concerns** (upload vs cache)
- ✅ **Easier testing** (mock cache, not ImageKit)
- ✅ **Better error handling** (cache errors vs upload errors)

---

**Next Step:** Review this design and approve implementation plan.
