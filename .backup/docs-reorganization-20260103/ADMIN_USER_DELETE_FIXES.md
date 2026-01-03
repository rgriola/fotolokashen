# Admin User Deletion - ImageKit & Photo Fixes

**Date**: 2026-01-02  
**Status**: ✅ **FIXED**

---

## 🐛 Issues Fixed

### **Issue 1: User Folder Remains in ImageKit**
**Problem**: When deleting a user, individual photos were deleted but the `/users/3/` folder remained in ImageKit.

**Solution**: Added code to delete the entire user folder after deleting individual files.

**Code Change** (`src/app/api/admin/users/[id]/route.ts`):
```typescript
// After deleting individual photo files...

// Delete the user's folder from ImageKit (e.g., /users/3/)
try {
    const userFolderPath = `/users/${userId}/`;
    console.log(`[DeleteUser] Attempting to delete user folder: ${userFolderPath}`);
    await imagekit.deleteFolder(userFolderPath);
    console.log(`[DeleteUser] Deleted user folder ${userFolderPath} from ImageKit`);
} catch (error) {
    console.error(`[DeleteUser] Failed to delete user folder from ImageKit:`, error);
    // Continue even if folder deletion fails
}
```

---

### **Issue 2: Photo Records Not Deleted from Database**
**Problem**: Photo records remained in the `photos` table with `userId` set to `null` instead of being deleted.

**Root Cause**: The Prisma schema had `userId Int?` (nullable) but no `onDelete: Cascade` rule, so Prisma set the field to `null` instead of deleting the record.

**Solution**: Added `onDelete: Cascade` to the Photo model's user relation.

**Schema Change** (`prisma/schema.prisma`):
```diff
model Photo {
  // ...fields
- uploader User? @relation("PhotoUploader", fields: [userId], references: [id])
+ uploader User? @relation("PhotoUploader", fields: [userId], references: [id], onDelete: Cascade)
}
```

**Migration Applied**:
```bash
npx prisma db push
```

---

## ✅ Current Behavior

When an admin deletes a user, the following happens **in order**:

1. **Fetch user data** with all photos
2. **Delete individual photos** from ImageKit CDN
3. **Delete user folder** from ImageKit (e.g., `/users/3/`)
4. **Delete user** from database
5. **Cascade delete triggers**:
   - ✅ Sessions deleted
   - ✅ Locations deleted
   - ✅ **Photos deleted** (now fixed!)
   - ✅ Saves deleted
   - ✅ Security logs deleted
   - ✅ Phone verifications deleted
6. **Create audit log** with deletion details
7. **Return success** response

---

## 🧪 Test Results

### **Before Fix:**
```
❌ User deleted
❌ Photos deleted from ImageKit
❌ User folder `/users/3/` remains in ImageKit
❌ Photo records remain with userId = null
```

### **After Fix:**
```
✅ User deleted
✅ Photos deleted from ImageKit
✅ User folder `/users/3/` deleted from ImageKit
✅ Photo records deleted from database
```

---

## 📊 Database Impact

### **Cascade Delete Chain:**
```
User (deleted)
  ├─ Photo (onDelete: Cascade) ✅ Now deletes
  ├─ Session (onDelete: Cascade) ✅
  ├─ Location (onDelete: Cascade) ✅
  ├─ UserSave (onDelete: Cascade) ✅
  ├─ SecurityLog (onDelete: Cascade) ✅
  └─ PhoneVerification (onDelete: Cascade) ✅
```

---

## 🔍 Verification Steps

1. **Delete a test user** via admin panel
2. **Check ImageKit**:
   - Individual photos should be gone
   - User folder (e.g., `/users/3/`) should be gone
3. **Check database** (`photos` table):
   - No records with deleted user's ID
   - No records with `userId = null` (orphaned photos)
4. **Check audit log** (`security_logs` table):
   - Event type: `ADMIN_USER_DELETED`
   - Metadata includes deleted user details

---

## 📝 Code Files Modified

1. **`prisma/schema.prisma`** - Added cascade delete
2. **`src/app/api/admin/users/[id]/route.ts`** - Added folder deletion

---

## 🎉 Complete!

Both issues are now fixed:
- ✅ User folders are completely removed from ImageKit
- ✅ Photo records are properly deleted from database

**Ready for production!** 🚀
