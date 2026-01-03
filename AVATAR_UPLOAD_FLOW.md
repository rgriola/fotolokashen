# Avatar Upload Flow - Complete Trace

## Overview
User profile avatars are uploaded to ImageKit CDN and the URL is stored in the PostgreSQL database. This document traces the complete flow from UI interaction to database storage.

---

## 📁 File Structure

### **Frontend Components**
- `src/app/profile/page.tsx` - Profile page that renders avatar upload
- `src/components/profile/AvatarUpload.tsx` - Avatar upload UI component
- `src/components/layout/AuthButton.tsx` - Displays avatar in header

### **API Endpoints**
- `src/app/api/auth/avatar/route.ts` - Avatar upload/delete API

### **Utilities & Config**
- `src/lib/imagekit.ts` - ImageKit upload/delete functions
- `src/lib/constants/upload.ts` - Folder path generators
- `src/lib/api-middleware.ts` - Authentication middleware

### **Database**
- `prisma/schema.prisma` - User model with `avatar: String?` field

---

## 🔄 Upload Flow (Step-by-Step)

### **1. UI Interaction** (`AvatarUpload.tsx`)
**Location**: `src/components/profile/AvatarUpload.tsx`

```typescript
// Line 49-78: uploadAvatar function
const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/auth/avatar', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        
        // ... success handling
    }
}
```

**What happens:**
1. User clicks "Change avatar" button (line 142)
2. File input opens via `fileInputRef.current.click()` (line 145)
3. User selects image file
4. `handleFileChange()` validates file (size, type) (line 37-47)
5. `uploadAvatar()` creates FormData and POSTs to `/api/auth/avatar`

---

### **2. API Endpoint** (`/api/auth/avatar/route.ts`)
**Location**: `src/app/api/auth/avatar/route.ts`

```typescript
// Line 11-78: POST handler
export async function POST(request: NextRequest) {
    // 1. Authenticate user
    const authResult = await requireAuth(request);
    
    // 2. Extract file from FormData
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    // 3. Validate file
    // - Must be an image
    // - Max 5MB size
    
    // 4. Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 5. Upload to ImageKit
    const uploadResult = await uploadToImageKit({
        file: buffer,
        fileName: `avatar-${userId}-${Date.now()}`,
        folder: FOLDER_PATHS.userAvatars(userId),
        tags: ['avatar', `user-${userId}`],
    });
    
    // 6. Update database
    await prisma.user.update({
        where: { id: userId },
        data: { avatar: uploadResult.url },
    });
    
    return apiResponse({ avatarUrl: uploadResult.url });
}
```

**Processing:**
1. **Authentication** (line 13-17): Verify user is logged in via `requireAuth()`
2. **File Extraction** (line 19-20): Get file from FormData
3. **Validation** (line 22-35):
   - Check file type (must be `image/*`)
   - Check file size (max 5MB)
4. **Buffer Conversion** (line 37-39): Convert File to Buffer for ImageKit
5. **ImageKit Upload** (line 41-47): Upload to CDN
6. **Database Update** (line 57-60): Save ImageKit URL to user.avatar field
7. **Response** (line 70-74): Return success + new avatar URL

---

### **3. ImageKit Upload** (`imagekit.ts`)
**Location**: `src/lib/imagekit.ts`

```typescript
// Line 61-89: uploadToImageKit function
export async function uploadToImageKit({
    file,
    fileName,
    folder = '/',
    tags = [],
}) {
    const imagekit = getImageKitInstance();
    
    const result = await imagekit.upload({
        file,              // Buffer
        fileName,          // avatar-{userId}-{timestamp}
        folder,            // /{env}/users/{userId}/avatars
        tags,              // ['avatar', 'user-{userId}']
        useUniqueFileName: true,
    });
    
    return {
        success: true,
        url: result.url,    // Full ImageKit URL
        fileId: result.fileId,
    };
}
```

**ImageKit Configuration** (line 49-58):
```typescript
function getImageKitInstance() {
    const ImageKit = require('imagekit');
    
    return new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: 'https://ik.imagekit.io/rgriola',
    });
}
```

**Result:**
- File uploaded to ImageKit CDN
- Returns full URL like: `https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1-1735913742233.jpg`

---

### **4. Folder Path Generation** (`upload.ts`)
**Location**: `src/lib/constants/upload.ts`

```typescript
// Line 42-44: Avatar folder path
userAvatars: (userId: number) =>
    `/${getEnvironment()}/users/${userId}/avatars`,

// Line 20-23: Environment detection
function getEnvironment() {
    return process.env.NODE_ENV === 'production' 
        ? 'production' 
        : 'development';
}
```

**Folder Structure:**
```
ImageKit Root
├── development/
│   └── users/
│       ├── 1/
│       │   └── avatars/
│       │       └── avatar-1-1735913742233.jpg
│       └── 2/
│           └── avatars/
└── production/
    └── users/
        ├── 1/
        │   └── avatars/
        └── 2/
            └── avatars/
```

**Benefits:**
- ✅ Environment separation (dev/prod)
- ✅ User isolation (each user has own folder)
- ✅ Easy cleanup (delete entire user folder)
- ✅ No conflicts (unique filenames with timestamps)

---

### **5. Database Storage** (`schema.prisma`)
**Location**: `prisma/schema.prisma`

```prisma
model User {
  id       Int     @id @default(autoincrement())
  avatar   String? // Full ImageKit URL
  // ... other fields
}
```

**Stored Value Example:**
```
https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1-1735913742233.jpg
```

**Database Operation:**
```sql
UPDATE users 
SET avatar = 'https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1-1735913742233.jpg',
    updatedAt = NOW()
WHERE id = 1;
```

---

### **6. Display Flow** (`AuthButton.tsx`)
**Location**: `src/components/layout/AuthButton.tsx`

```typescript
// Line 58-66: Avatar display
{user.avatar && !avatarError ? (
    <AvatarImage
        src={getOptimizedAvatarUrl(user.avatar, 32) || user.avatar}
        alt={user.username}
        onError={() => setAvatarError(true)}
    />
) : (
    <AvatarFallback>{initials}</AvatarFallback>
)}
```

**Optimization** (line 28-42 in `imagekit.ts`):
```typescript
export function getOptimizedAvatarUrl(url: string, size: number) {
    return `${url}?tr=w-${size},h-${size},c-at_max,fo-auto,q-80`;
}
```

**Result:**
```
Original: https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1.jpg
Optimized: https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1.jpg?tr=w-32,h-32,c-at_max,fo-auto,q-80
```

**ImageKit Transformations:**
- `w-32,h-32` = 32x32 pixels
- `c-at_max` = maintain aspect ratio
- `fo-auto` = auto format (WebP for modern browsers)
- `q-80` = 80% quality

---

## 🗑️ Delete Flow

### **1. UI Interaction** (`AvatarUpload.tsx`)
```typescript
// Line 83-109: handleRemoveAvatar
const handleRemoveAvatar = async () => {
    const response = await fetch('/api/auth/avatar', {
        method: 'DELETE',
        credentials: 'include',
    });
    
    // ... success handling
}
```

### **2. API Endpoint** (`/api/auth/avatar/route.ts`)
```typescript
// Line 84-105: DELETE handler
export async function DELETE(request: NextRequest) {
    const authResult = await requireAuth(request);
    
    await prisma.user.update({
        where: { id: authResult.user.id },
        data: { avatar: null },
    });
    
    return apiResponse({ success: true });
}
```

**Note:** Currently does NOT delete the file from ImageKit (line 67 comment). Old avatars remain in CDN but are no longer referenced. This is intentional for now to avoid accidental data loss.

---

## 🔐 Security Features

### **Authentication**
- All requests require valid session cookie
- `requireAuth()` middleware validates user (line 13 in avatar route)
- User can only upload/delete their own avatar

### **Validation**
1. **File Type**: Must be `image/*` (line 28-30)
2. **File Size**: Max 5MB (line 33-35)
3. **User Ownership**: Can't modify other users' avatars

### **Server-Side Processing**
- ImageKit SDK only used server-side (lazy loaded with `require()`)
- Private key never exposed to client
- All uploads go through authenticated API endpoint

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                         │
│    AvatarUpload.tsx                                         │
│    - User clicks "Change avatar"                            │
│    - Selects image file                                     │
│    - Validates: size < 5MB, type = image/*                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ POST /api/auth/avatar
                   │ FormData: { avatar: File }
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API AUTHENTICATION                                       │
│    requireAuth() middleware                                 │
│    - Validates session cookie                               │
│    - Loads user from database                               │
│    - Returns user object                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Authenticated User
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FILE PROCESSING                                          │
│    /api/auth/avatar/route.ts                                │
│    - Extract file from FormData                             │
│    - Validate file type and size                            │
│    - Convert to Buffer                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Buffer + metadata
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. IMAGEKIT UPLOAD                                          │
│    uploadToImageKit()                                       │
│    - fileName: avatar-{userId}-{timestamp}                  │
│    - folder: /{env}/users/{userId}/avatars                  │
│    - tags: ['avatar', 'user-{userId}']                      │
│    - Returns: { url, fileId }                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ ImageKit URL
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. DATABASE UPDATE                                          │
│    prisma.user.update()                                     │
│    UPDATE users                                             │
│    SET avatar = 'https://ik.imagekit.io/...'                │
│    WHERE id = {userId}                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Success response
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UI UPDATE                                                │
│    - Toast success message                                  │
│    - Refresh user data (queryClient.invalidateQueries)      │
│    - Display new avatar in header                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Files Reference

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **UI Component** | `src/components/profile/AvatarUpload.tsx` | Avatar upload form with preview |
| **Profile Page** | `src/app/profile/page.tsx` | Renders AvatarUpload component |
| **Header Display** | `src/components/layout/AuthButton.tsx` | Shows avatar in app header |
| **Upload API** | `src/app/api/auth/avatar/route.ts` | POST/DELETE handlers |
| **ImageKit Utils** | `src/lib/imagekit.ts` | Upload/delete/optimize functions |
| **Path Constants** | `src/lib/constants/upload.ts` | Folder path generators |
| **Database Schema** | `prisma/schema.prisma` | User.avatar field definition |
| **Auth Middleware** | `src/lib/api-middleware.ts` | requireAuth() function |

---

## 🎯 Summary

**Storage Location:**
- **CDN**: ImageKit (`https://ik.imagekit.io/rgriola`)
- **Database**: PostgreSQL User table (avatar column stores URL)

**Folder Structure:**
```
/{environment}/users/{userId}/avatars/avatar-{userId}-{timestamp}.{ext}
```

**Example:**
```
https://ik.imagekit.io/rgriola/production/users/1/avatars/avatar-1-1735913742233.jpg
```

**Process:**
1. User uploads image → FormData sent to `/api/auth/avatar`
2. API validates file → Converts to Buffer
3. ImageKit uploads file → Returns URL
4. Database updated → `users.avatar = url`
5. UI refreshes → Displays new avatar

**Features:**
- ✅ Authenticated uploads only
- ✅ File validation (type, size)
- ✅ Environment separation (dev/prod)
- ✅ Optimized delivery (WebP, resized)
- ✅ Graceful fallbacks (initials if no avatar)
- ✅ Error handling (404s don't break UI)
