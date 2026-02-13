# Unified Upload Security Implementation

**Implemented**: February 13, 2026  
**Status**: ✅ Complete

## Stack

- **Image Processing**: Sharp 0.33.x (server-side HEIC/TIFF conversion, compression)
- **Virus Scanning**: ClamAV (via clamav.js)
- **CDN**: ImageKit
- **Framework**: Next.js 16.0.10 / React 19 / TypeScript 5

## Summary

All 5 image upload entry points now use a unified secure pipeline with:
- **Server-side virus scanning** (ClamAV)
- **Server-side HEIC/TIFF → JPEG conversion** (Sharp)
- **Server-side compression** (adaptive quality targeting)
- **Centralized size limits** (FILE_SIZE_LIMITS constants)

## Upload Entry Points

| Entry Point | Component | API Endpoint | Security |
|-------------|-----------|--------------|----------|
| Avatar | AvatarUpload.tsx, ProfileHeader.tsx | POST /api/auth/avatar (FormData) | ✅ Virus scan, size validation |
| Banner | BannerUpload.tsx, ProfileHeader.tsx | POST /api/auth/banner (FormData) | ✅ Virus scan, size validation |
| Save Location | SaveLocationForm.tsx → usePhotoCacheManager.ts | POST /api/photos/upload | ✅ Full pipeline (scan, convert, compress) |
| Edit Location | EditLocationForm.tsx → usePhotoCacheManager.ts | POST /api/photos/upload | ✅ Full pipeline (scan, convert, compress) |
| Create with Photo | PhotoUploadWithGPS.tsx → ImageKitUploader.tsx | POST /api/photos/upload | ✅ Full pipeline (scan, convert, compress) |

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

### Avatar/Banner Upload Flow
```
Client: Select file → ImageEditor (crop) → FormData
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

### Location Photo Upload Flow
```
Client: Select file → Extract EXIF → Preview (Object URL)
          ↓
Client: On save → usePhotoCacheManager.uploadPhotoSecurely()
          ↓
Server: POST /api/photos/upload
          ↓
        Validate size (FILE_SIZE_LIMITS)
          ↓
        Virus scan (scanFile)
          ↓
        Convert HEIC/TIFF → JPEG (Sharp)
          ↓
        Compress to target size
          ↓
        Upload to ImageKit
          ↓
        Return URL, fileId, metadata
```

## Key Changes Made

### 1. Constants Centralization
- Added `FILE_SIZE_LIMITS.UPLOAD_MAX` (10MB global)
- Added `FILE_SIZE_LIMITS.BANNER` (10MB)
- Updated all validation to use constants instead of hardcoded values

### 2. AvatarUpload.tsx
- Removed: IKContext, IKUpload, direct ImageKit upload
- Added: `uploadAvatar()` using FormData to `/api/auth/avatar`
- Kept: ImageEditor for cropping

### 3. BannerUpload.tsx
- Removed: IKContext, IKUpload, authenticator
- Added: `uploadBanner()` using FormData to `/api/auth/banner`
- Direct upload (no cropping needed for banners)

### 4. ProfileHeader.tsx
- Removed: IKContext, IKUpload, authenticator, refs
- Added: `uploadAvatar()` and `uploadBanner()` using FormData
- Preserved: ImageEditor for avatar, BannerEditor for banner

### 5. usePhotoCacheManager.ts
- Removed: `getAuthParams()`, `uploadPhotoToImageKit()`, FOLDER_PATHS import
- Added: `uploadPhotoSecurely()` using `/api/photos/upload`
- This was the critical security fix - deferred uploads now go through secure pipeline

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

- `/src/lib/constants/upload.ts` - Added constants
- `/src/components/profile/AvatarUpload.tsx` - Secure FormData upload
- `/src/components/profile/BannerUpload.tsx` - Secure FormData upload
- `/src/components/profile/ProfileHeader.tsx` - Secure FormData upload
- `/src/hooks/usePhotoCacheManager.ts` - Secure deferred upload
- `/src/app/api/auth/avatar/route.ts` - Use constants
- `/src/app/api/auth/banner/route.ts` - Use constants
- `/src/app/api/photos/upload/route.ts` - Use constants
- `/src/app/api/locations/[id]/photos/request-upload/route.ts` - Use constants
- `/src/components/photos/PhotoUploadWithGPS.tsx` - Use constants

## Testing Checklist

- [ ] Avatar upload from Profile Settings page
- [ ] Avatar upload from ProfileHeader component
- [ ] Banner upload from BannerUpload component
- [ ] Banner upload from ProfileHeader component
- [ ] Photo upload via Save Location panel
- [ ] Photo upload via Edit Location panel
- [ ] Photo upload via Create with Photo workflow
- [ ] HEIC file conversion works
- [ ] Virus scan blocks infected files
- [ ] Size validation blocks oversized files
