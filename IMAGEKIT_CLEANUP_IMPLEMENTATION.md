# ImageKit Orphan Cleanup Implementation

## Problem
When users uploaded new avatars or banners, the old files remained in ImageKit, creating orphaned images and wasting storage space.

## Solution
Implemented automatic cleanup of previous images when new ones are uploaded.

---

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

Added two new fields to the `User` model to track ImageKit fileIds:

```prisma
model User {
  // ...existing fields...
  avatar          String?
  avatarFileId    String?  // NEW: ImageKit fileId for avatar deletion
  bannerImage     String?
  bannerFileId    String?  // NEW: ImageKit fileId for banner deletion
  // ...existing fields...
}
```

**Migration Applied**: ✅ Database columns added via `prisma db push`

---

### 2. Avatar Upload API (`src/app/api/auth/avatar/route.ts`)

**Updated Logic**:
1. Fetch current user's `avatarFileId` from database
2. **Delete old avatar from ImageKit** (if fileId exists)
3. Save new avatar URL and fileId to database

**Code Changes**:
```typescript
// Get current avatar fileId
const currentUser = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: { 
        avatar: true,
        avatarFileId: true  // NEW
    },
});

// Delete old avatar BEFORE saving new one
if (currentUser?.avatarFileId) {
    console.log('[Avatar API] Deleting old avatar:', currentUser.avatarFileId);
    const deleteResult = await deleteFromImageKit(currentUser.avatarFileId);
    if (!deleteResult.success) {
        console.warn('[Avatar API] Failed to delete old avatar:', deleteResult.error);
        // Continue anyway - don't block the upload
    }
}

// Update with new avatar URL AND fileId
await prisma.user.update({
    where: { id: authResult.user.id },
    data: { 
        avatar: avatarUrl,
        avatarFileId: fileId  // NEW: Store for future deletion
    },
});
```

---

### 3. Banner Upload API (`src/app/api/auth/banner/route.ts`)

**Updated Logic**:
1. Fetch current user's `bannerFileId` from database
2. **Delete old banner from ImageKit** (if fileId exists)
3. Save new banner URL and fileId to database

**Code Changes**:
```typescript
// Get current banner fileId
const currentUser = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: { 
        bannerImage: true,
        bannerFileId: true  // NEW
    },
});

// Delete old banner BEFORE saving new one
if (currentUser?.bannerFileId) {
    console.log('[Banner API] Deleting old banner:', currentUser.bannerFileId);
    const deleteResult = await deleteFromImageKit(currentUser.bannerFileId);
    if (!deleteResult.success) {
        console.warn('[Banner API] Failed to delete old banner:', deleteResult.error);
        // Continue anyway - don't block the upload
    }
}

// Update with new banner URL AND fileId
await prisma.user.update({
    where: { id: authResult.user.id },
    data: { 
        bannerImage: bannerUrl,
        bannerFileId: fileId  // NEW: Store for future deletion
    },
});
```

**Added Import**:
```typescript
import { deleteFromImageKit } from '@/lib/imagekit';
```

---

## How It Works

### Upload Flow

```
User selects new image
    ↓
Edit in canvas (crop/zoom/rotate)
    ↓
Convert to JPEG blob (0.9 quality)
    ↓
Upload to ImageKit
    ↓
ImageKit returns { url, fileId }
    ↓
Frontend sends { avatarUrl, fileId } to API
    ↓
API fetches old fileId from database
    ↓
API deletes old image from ImageKit  ← NEW STEP
    ↓
API saves new URL + fileId to database
    ↓
Success! Old image removed, new image saved
```

### Deletion Safety
- **Non-blocking**: If deletion fails, upload still succeeds (logged as warning)
- **Idempotent**: Safe to run multiple times
- **Null-safe**: Only deletes if `fileId` exists in database

---

## Benefits

✅ **No More Orphans**: Each user has exactly 1 avatar and 1 banner in ImageKit  
✅ **Storage Savings**: Old images automatically removed  
✅ **Cost Reduction**: Lower ImageKit storage costs  
✅ **Clean Media Library**: Easier to manage and audit files  
✅ **Backwards Compatible**: Existing users without fileIds continue to work  

---

## Future Cleanup (Optional)

For **existing orphaned files** created before this implementation:

1. **Run cleanup script** to remove orphans in `/development/users/*/avatars` and `/development/users/*/banners` folders
2. **Migrate production** when ready:
   - Apply same schema changes to production database
   - Run cleanup script on production ImageKit folder

---

## Testing Checklist

- [x] Database schema updated with `avatarFileId` and `bannerFileId`
- [x] Prisma Client regenerated with new types
- [x] Avatar upload API deletes old file before saving new one
- [x] Banner upload API deletes old file before saving new one
- [ ] Test: Upload avatar → verify old avatar deleted from ImageKit
- [ ] Test: Upload banner → verify old banner deleted from ImageKit
- [ ] Test: Check ImageKit folders have only 1 file per user
- [ ] Test: Verify upload still works if deletion fails

---

## Related Files

- `prisma/schema.prisma` - Database schema
- `src/app/api/auth/avatar/route.ts` - Avatar upload with cleanup
- `src/app/api/auth/banner/route.ts` - Banner upload with cleanup
- `src/lib/imagekit.ts` - `deleteFromImageKit()` utility function
- `src/components/profile/ProfileHeader.tsx` - Frontend upload (sends fileId)

---

**Implementation Date**: January 13, 2026  
**Status**: ✅ Complete - Ready for testing
