# Avatar Storage Analysis - January 3, 2026

## Question
"In my profile I have an avatar but it is not on ImageKit. Where would it come from? It is a photo I previously uploaded."

## Answer
**Your avatar IS on ImageKit!** ✅

However, there's an **environment mismatch** between your database and ImageKit folder structure.

---

## Current State

### Production Database (merkelvision.com)
```
User ID: 1
Email: rodczaro@gmail.com
Avatar: https://ik.imagekit.io/rgriola/development/users/1/avatars/avatar-1-1767394857740_VqsE79DFC
Status: ✅ File exists and loads (HTTP 200)
```

### The Issue
The production database is pointing to an avatar in the **`/development/`** folder instead of **`/production/`** folder on ImageKit.

This affects 2 users:
- User 1 (rodczaro@gmail.com) → `/development/users/1/avatars/`
- User 6 (baseballczar@gmail.com) → `/development/users/6/avatars/`

---

## Why This Happened

### Environment Detection Logic
**File**: `src/lib/constants/upload.ts` (Line 22)

```typescript
export function getEnvironment(): 'development' | 'production' {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}
```

### Folder Path Generation
**File**: `src/lib/constants/upload.ts` (Line 43-44)

```typescript
userAvatars: (userId: number) =>
    `/${getEnvironment()}/users/${userId}/avatars`,
```

### What Happened
When the avatars were uploaded:
1. The avatars were uploaded from **production** (merkelvision.com)
2. But `NODE_ENV` was either:
   - Not set to `production` in Vercel environment variables, OR
   - The upload happened during development/testing
3. `getEnvironment()` returned `'development'`
4. Avatar was saved to `/development/users/{userId}/avatars/`
5. Database stored the development path URL

---

## Impact

### Current Behavior
- ✅ **Avatars work fine** (files exist and load)
- ⚠️ **Wrong folder** (development instead of production)
- ⚠️ **Cleanup concern** (if you clean up development folder, production users lose avatars)

### Where Files Are Actually Located

**ImageKit Structure:**
```
https://ik.imagekit.io/rgriola/
├── development/
│   └── users/
│       ├── 1/
│       │   └── avatars/
│       │       └── avatar-1-1767394857740_VqsE79DFC  ← Production users pointing here!
│       └── 6/
│           └── avatars/
│               └── avatar-6-1767395144526_-KsEz1Wop  ← Production users pointing here!
└── production/
    └── users/
        └── (empty - no production avatars uploaded yet)
```

---

## Verification Steps

### Check Avatar URL
```bash
curl -I "https://ik.imagekit.io/rgriola/development/users/1/avatars/avatar-1-1767394857740_VqsE79DFC"
```

**Result:**
```
HTTP/2 200 
content-type: image/jpeg
content-length: 1137993
```
✅ File exists and is accessible

---

## Solutions

### Option 1: Do Nothing (Recommended for Now)
- ✅ Avatars work fine
- ✅ No user-facing issues
- ⚠️ Keep in mind when cleaning up ImageKit folders

### Option 2: Move Files to Production Folder
Manually move files from `/development/` to `/production/` on ImageKit and update database:

```sql
-- For User 1
UPDATE users 
SET avatar = 'https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1-1767394857740_VqsE79DFC'
WHERE id = 1;

-- For User 6
UPDATE users 
SET avatar = 'https://ik.imagekit.io/rgriola/production/users/6/avatars/avatar-6-1767395144526_-KsEz1Wop'
WHERE id = 6;
```

### Option 3: Re-upload Avatars
Ask users to re-upload their avatars. This will:
- ✅ Use correct production folder
- ✅ Set proper `NODE_ENV=production` in Vercel
- ✅ Clean solution going forward

---

## Fix for Future Uploads

### Verify Vercel Environment Variable
Make sure `NODE_ENV=production` is set in Vercel project settings:

1. Go to Vercel Dashboard
2. Select project "merkel-vision"
3. Settings → Environment Variables
4. Add/verify: `NODE_ENV = production`

### Test After Fix
```bash
# In Vercel production, this should return 'production':
console.log(process.env.NODE_ENV);

# This should return '/production/users/1/avatars':
console.log(FOLDER_PATHS.userAvatars(1));
```

---

## Summary

**Question**: Where does my avatar come from if it's not on ImageKit?

**Answer**: 
- Your avatar **IS on ImageKit** ✅
- It's stored at: `/development/users/1/avatars/avatar-1-1767394857740_VqsE79DFC`
- The production database correctly references this URL
- The file exists and loads successfully (HTTP 200)

**Issue**: 
- Avatars are in `/development/` folder instead of `/production/` folder
- This happened because `NODE_ENV` wasn't set to `production` during upload

**Impact**: 
- No immediate user-facing issues
- Be careful when cleaning up development files on ImageKit

**Recommendation**: 
- Continue using current avatars (they work fine)
- Verify `NODE_ENV=production` is set in Vercel
- Future uploads will use correct production folder
- Consider migrating files if you plan to separate dev/prod environments strictly
