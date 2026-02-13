# Unified Upload Security Implementation

**Implemented**: February 13, 2026  
**Last Updated**: February 13, 2026 @ 11:55 PM  
**Status**: ✅ Complete (All Upload Entry Points Unified)

## Stack

- **Image Processing**: Sharp 0.33.x (server-side HEIC/TIFF conversion, compression)
- **Browser Conversion**: heic2any + UTIF (client-side preview conversion)
- **Virus Scanning**: ClamAV (via clamav.js)
- **CDN**: ImageKit
- **Framework**: Next.js 16.1.6 / React 19 / TypeScript 5

## Summary

All 5 image upload entry points now use a unified secure pipeline with:
- **Server-side virus scanning** (ClamAV)
- **Server-side HEIC/TIFF → JPEG conversion** (Sharp)
- **Server-side compression** (adaptive quality targeting)
- **Browser-side HEIC/TIFF conversion** (heic2any + UTIF for proper previews)
- **Centralized size limits** (FILE_SIZE_LIMITS constants)

## Upload Entry Points

| Entry Point | Component | API Endpoint | Security |
|-------------|-----------|--------------|----------|
| Avatar | AvatarUpload.tsx → ImageEditor | POST /api/auth/avatar (FormData) | ✅ Virus scan, size validation, browser HEIC/TIFF conversion |
| Banner | BannerUpload.tsx | POST /api/auth/banner (FormData) | ✅ Virus scan, size validation, browser HEIC/TIFF conversion |
| Save Location | SaveLocationForm.tsx → usePhotoCacheManager.ts | POST /api/photos/upload | ✅ Full pipeline (scan, convert, compress) |
| Edit Location | EditLocationForm.tsx → usePhotoCacheManager.ts | POST /api/photos/upload | ✅ Full pipeline + browser-side HEIC/TIFF conversion |
| Create with Photo | CreateLocationWithPhoto.tsx → usePhotoCacheManager.ts | POST /api/photos/upload | ✅ Full pipeline + browser-side HEIC/TIFF conversion |

## File Size Limits (Centralized)

All limits defined in `/src/lib/constants/upload.ts`:

```typescript
export const FILE_SIZE_LIMITS = {
    UPLOAD_MAX: 10,  // Global max (MB)
    PHOTO: 10,       // Location photos
    AVATAR: 5,       // User avatars
    BANNER: 10,      // Profile banners
};
```

## Security Flow

### Avatar/Banner Upload Flow (Updated Feb 13)
```
Client: Select file → Validate type/size
          ↓
Client: HEIC/TIFF? → Convert to JPEG browser-side (heic2any/UTIF)
          ↓
Client: Show conversion progress (spinner)
          ↓
Avatar: → ImageEditor (crop/rotate/zoom) → FormData
Banner: → FormData (direct upload, no cropping)
          ↓
Server: /api/auth/avatar or /api/auth/banner
          ↓
        Validate size (FILE_SIZE_LIMITS)
          ↓
        Virus scan (scanFile)
          ↓
        Upload to ImageKit
          ↓
        Update database
```

### Location Photo Upload Flow (Edit Location Panel - Updated Feb 13)
```
Client: Select file → Validate type/size
          ↓
Client: HEIC/TIFF? → Convert to JPEG browser-side (heic2any/UTIF)
          ↓
Client: Create Object URL preview → Display in PhotoCarouselManager
          ↓
Client: Cache converted JPEG file (deferred upload)
          ↓
Client: User clicks "Update" → usePhotoCacheManager.uploadAllToImageKit()
          ↓
Server: POST /api/photos/upload
          ↓
        Validate size (FILE_SIZE_LIMITS)
          ↓
        Virus scan (scanFile)
          ↓
        Convert HEIC/TIFF → JPEG (Sharp - backup if not converted client-side)
          ↓
        Compress to target size
          ↓
        Upload to ImageKit
          ↓
        Return URL, fileId, metadata
```

**Key Changes (Feb 13, 2026):**
- Deferred upload mode: Photos only upload when form is saved (prevents orphans)
- Browser-side HEIC/TIFF conversion: Users see proper previews immediately
- PhotoCarouselManager: Error handling with fallback UI for unsupported formats

## Key Changes Made

### 1. Constants Centralization
- Added `FILE_SIZE_LIMITS.UPLOAD_MAX` (10MB global)
- Added `FILE_SIZE_LIMITS.BANNER` (10MB)
- Updated all validation to use constants instead of hardcoded values

### 2. AvatarUpload.tsx
- Removed: IKContext, IKUpload, direct ImageKit upload
- Added: `uploadAvatar()` using FormData to `/api/auth/avatar`
- Added: Browser-side HEIC/TIFF → JPEG conversion (heic2any + UTIF)
- Added: Conversion progress indicator (Loader2 spinner)
- Kept: ImageEditor for cropping

### 3. BannerUpload.tsx
- Removed: IKContext, IKUpload, authenticator
- Added: `uploadBanner()` using FormData to `/api/auth/banner`
- Added: Browser-side HEIC/TIFF → JPEG conversion (heic2any + UTIF)
- Added: Conversion progress indicator (Loader2 spinner)
- Direct upload (no cropping needed for banners)

### 4. ProfileHeader.tsx
- Removed: IKContext, IKUpload, authenticator, refs
- Added: `uploadAvatar()` and `uploadBanner()` using FormData
- Preserved: ImageEditor for avatar, BannerEditor for banner

### 5. usePhotoCacheManager.ts
- Removed: `getAuthParams()`, `uploadPhotoToImageKit()`, FOLDER_PATHS import
- Added: `uploadPhotoSecurely()` using `/api/photos/upload`
- Added: Browser-side HEIC/TIFF → JPEG conversion (heic2any + UTIF)
- Added: Toast feedback during conversion ("Converting test.tif to JPEG...")
- This was the critical security fix - deferred uploads now go through secure pipeline
- **Feb 13 Update**: Files are now converted before caching, so previews display correctly

### 6. PhotoCarouselManager.tsx (Feb 13 Update)
- Added: `imageLoadError` state + fallback UI for unsupported formats
- Added: Graceful error handling with Camera icon placeholder
- Added: Thumbnail error handling with fallback icons
- Fixed: Race condition when deleting photos (currentIndex bounds check)
- Shows file info when preview unavailable: filename, mimeType, size

### 7. EditLocationForm.tsx (Feb 13 Update)
- Converted to deferred upload mode (uploadMode="deferred")
- Added: `cachedPhotos` state + `uploadPhotosRef` for upload function
- Added: Change tracking for cached photos ("X new photo(s) ready to upload")
- Modified: handleRemovePhoto distinguishes existing vs cached photos
- On save: Uploads cached photos first, then combines with existing photos

### 6. Backend API Updates
- `/api/auth/avatar` - Uses `FILE_SIZE_LIMITS.AVATAR`
- `/api/auth/banner` - Uses `FILE_SIZE_LIMITS.BANNER`
- `/api/photos/upload` - Uses `FILE_SIZE_LIMITS.BANNER` for uploadType='banner'
- `/api/locations/[id]/photos/request-upload` - Uses `FILE_SIZE_LIMITS.PHOTO`

## Metadata Preservation

EXIF metadata is:
1. **Extracted client-side** before any conversion
2. **Sent to server** in metadata field
3. **Stored in database** (Photo model has lat, lng, takenAt, etc.)
4. **Sanitized server-side** to prevent XSS in description fields

## UX Preservation

- Client-side Object URL previews remain unchanged
- Users see photo previews immediately after selection
- Secure upload happens when the form is saved
- Loading indicators during upload

## Files Modified

### Core Security (Phase 1)
- `/src/lib/constants/upload.ts` - Added constants
- `/src/components/profile/AvatarUpload.tsx` - Secure FormData upload
- `/src/components/profile/BannerUpload.tsx` - Secure FormData upload
- `/src/components/profile/ProfileHeader.tsx` - Secure FormData upload
- `/src/hooks/usePhotoCacheManager.ts` - Secure deferred upload + browser conversion
- `/src/app/api/auth/avatar/route.ts` - Use constants
- `/src/app/api/auth/banner/route.ts` - Use constants
- `/src/app/api/photos/upload/route.ts` - Use constants
- `/src/app/api/locations/[id]/photos/request-upload/route.ts` - Use constants
- `/src/components/photos/PhotoUploadWithGPS.tsx` - Use constants

### Edit Location Panel (Feb 13, 2026)
- `/src/components/locations/EditLocationForm.tsx` - Deferred upload mode, cached photos state
- `/src/components/ui/PhotoCarouselManager.tsx` - Error handling, fallback UI, race condition fix
- `/src/components/ui/ImageKitUploader.tsx` - Fixed API response parsing (removed .data wrapper)
- `/src/hooks/usePhotoCacheManager.ts` - Browser-side HEIC/TIFF conversion

## Testing Checklist

### Avatar/Banner
- [ ] Avatar upload from Profile Settings page
- [ ] Avatar upload from ProfileHeader component
- [ ] Banner upload from BannerUpload component
- [ ] Banner upload from ProfileHeader component

### Location Photos
- [ ] Photo upload via Save Location panel
- [x] Photo upload via Edit Location panel (Feb 13)
- [ ] Photo upload via Create with Photo workflow

### Format Conversion
- [x] HEIC file browser-side conversion works (Feb 13)
- [x] TIFF file browser-side conversion works (Feb 13)
- [x] Preview displays correctly after conversion (Feb 13)
- [x] Fallback UI shows when browser can't preview (Feb 13)

### Security
- [ ] Virus scan blocks infected files
- [ ] Size validation blocks oversized files
- [x] Deferred upload prevents orphaned images (Feb 13)
- [x] Photos only upload when form is saved (Feb 13)

### Bug Fixes Verified (Feb 13)
- [x] PhotoCarouselManager race condition fixed
- [x] API response parsing (.data wrapper removed)
- [x] Cached photo deletion works correctly
- [x] Change tracking includes cached photos
