# ImageKit Flat Folder Implementation Plan

## Overview
This plan provides a complete guide to implementing ImageKit CDN with a **flat folder structure** for any project, based on the fotolokashen implementation. The flat folder approach stores all user files in simple user directories (`/users/{userId}/photos`) while letting your database manage relationships (tags, locations, albums, etc.).

## Why Flat Folder Structure?

### ✅ Benefits
- **Scalability**: No deeply nested folders that slow down CDN operations
- **Fast retrieval**: Direct path to user files
- **Database-driven relationships**: Location, tags, albums managed in DB, not folders
- **Easy migration**: Simple to reorganize without moving files
- **Clear ownership**: One user, one folder

### ❌ Avoid Nested Structures
```
❌ BAD: /users/1/locations/abc123/photos/photo1.jpg
✅ GOOD: /users/1/photos/photo1.jpg (location stored in DB)
```

---

## Architecture

### File Storage: ImageKit CDN
- Stores only the physical files
- Organized by user and file type
- Environment-separated (development/production)

### Metadata: Database
- File relationships (location, albums, tags)
- User permissions
- Upload metadata (timestamp, source, EXIF)
- Display order (isPrimary, sortOrder)

---

## Implementation Steps

### 1. Environment Variables Setup

#### Required Variables
```bash
# .env.local (Development)
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/YOUR_ID"
IMAGEKIT_PRIVATE_KEY="private_key_from_imagekit"
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="public_key_from_imagekit"

# Also set in Vercel for production
# Settings → Environment Variables
```

#### Get ImageKit Credentials
1. Sign up at https://imagekit.io
2. Dashboard → Developer Options → API Keys
3. Copy:
   - URL Endpoint (public, goes in both server/client)
   - Public Key (public, client-safe)
   - Private Key (SECRET, server-only)

---

### 2. Install Dependencies

```bash
npm install imagekit imagekitio-react
```

**Packages:**
- `imagekit` - Node.js SDK (server-side operations)
- `imagekitio-react` - React components (optional, for direct client uploads)

---

### 3. Create ImageKit Configuration File

**File:** `src/lib/imagekit.ts`

```typescript
/**
 * ImageKit Configuration
 * Centralized configuration for ImageKit CDN
 */

// ImageKit URL Endpoint - reads from environment variable
export const IMAGEKIT_URL_ENDPOINT = 
    process.env.IMAGEKIT_URL_ENDPOINT ||              // Server-side
    'https://ik.imagekit.io/YOUR_ID';                 // Client fallback

// Validate at module load
if (!IMAGEKIT_URL_ENDPOINT) {
    console.error('❌ CRITICAL: ImageKit URL endpoint not configured!');
}

// Environment-based folder prefix
const ENV_FOLDER = process.env.NODE_ENV === 'production' ? '/production' : '/development';

/**
 * Get ImageKit folder path with environment prefix
 * @param path - Path relative to environment (e.g., 'users/123/photos')
 * @returns Full folder path with environment prefix
 */
export function getImageKitFolder(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${ENV_FOLDER}/${cleanPath}`;
}

/**
 * Constructs full ImageKit URL from file path
 * CLIENT-SAFE - no SDK initialization required
 * @param filePath - ImageKit file path (e.g., /development/users/123/photo.jpg)
 * @param transformations - Optional ImageKit transformations
 * @returns Full ImageKit URL with optional transformations
 */
export function getImageKitUrl(filePath: string, transformations?: string): string {
    if (!IMAGEKIT_URL_ENDPOINT) {
        console.warn('ImageKit URL endpoint not configured');
        return '';
    }
    
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const baseUrl = `${IMAGEKIT_URL_ENDPOINT}${cleanPath}`;
    
    if (transformations) {
        return `${baseUrl}?tr=${transformations}`;
    }
    
    return baseUrl;
}

/**
 * Get ImageKit instance for SERVER-SIDE operations only
 */
function getImageKitInstance() {
    // Dynamic import to ensure this only runs on server
    const ImageKit = require('imagekit');

    return new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
        urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
}

/**
 * Upload file to ImageKit (SERVER-SIDE ONLY)
 */
export async function uploadToImageKit({
    file,
    fileName,
    folder = '/',
    tags = [],
}: {
    file: Buffer | string;
    fileName: string;
    folder?: string;
    tags?: string[];
}): Promise<{ success: boolean; url?: string; fileId?: string; error?: string }> {
    try {
        const imagekit = getImageKitInstance();

        const result = await imagekit.upload({
            file,
            fileName,
            folder,
            tags,
            useUniqueFileName: true,
        });

        return {
            success: true,
            url: result.url,
            fileId: result.fileId,
        };
    } catch (error: unknown) {
        console.error('ImageKit upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Delete file from ImageKit (SERVER-SIDE ONLY)
 */
export async function deleteFromImageKit(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const imagekit = getImageKitInstance();
        await imagekit.deleteFile(fileId);
        return { success: true };
    } catch (error: unknown) {
        console.error('ImageKit delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}

/**
 * Generate signed upload parameters for client-side uploads
 * SERVER-SIDE ONLY
 */
export async function generateImageKitAuth(): Promise<{
    token: string;
    signature: string;
    expire: number;
}> {
    try {
        const imagekit = getImageKitInstance();
        return imagekit.getAuthenticationParameters();
    } catch (error: unknown) {
        console.error('ImageKit auth generation error:', error);
        throw new Error('Failed to generate authentication');
    }
}
```

---

### 4. Define Folder Structure Constants

**File:** `src/lib/constants/upload.ts`

```typescript
/**
 * Upload Constants
 * Centralized constants for photo uploads and storage paths
 */

/**
 * Get current environment for ImageKit folder paths
 */
export function getEnvironment(): 'development' | 'production' {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

/**
 * ImageKit folder path generators
 * FLAT STRUCTURE: Simple user directories with environment separation
 * 
 * Structure: /{environment}/users/{userId}/photos/
 * - Fast retrieval (no deep nesting)
 * - Environment isolated (dev/prod separate)
 * - Database manages relationships (location, tags, albums, etc.)
 * - Easy to migrate/reorganize
 */
export const FOLDER_PATHS = {
    // Photos: Flat directory per user
    userPhotos: (userId: number) =>
        `/${getEnvironment()}/users/${userId}/photos`,
    
    // Avatars: Separate from photos for easier management
    userAvatars: (userId: number) =>
        `/${getEnvironment()}/users/${userId}/avatars`,
    
    // Documents or other files
    userFiles: (userId: number) =>
        `/${getEnvironment()}/users/${userId}/files`,
} as const;

/**
 * File size limits (in MB)
 */
export const FILE_SIZE_LIMITS = {
    PHOTO: 10,
    AVATAR: 5,
    DOCUMENT: 20,
} as const;
```

---

### 5. Create Authentication API Endpoint

**File:** `src/app/api/imagekit/auth/route.ts`

```typescript
import { NextRequest } from 'next/server';
import ImageKit from 'imagekit';

/**
 * GET /api/imagekit/auth
 * Generate ImageKit authentication parameters for client-side uploads
 * Requires user authentication
 */
export async function GET(request: NextRequest) {
    try {
        // Add your authentication check here
        // Example: const user = await getUserFromRequest(request);
        // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        // Initialize ImageKit
        const imagekit = new ImageKit({
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
        });

        // Generate authentication parameters (valid for 5 minutes)
        const authenticationParameters = imagekit.getAuthenticationParameters();

        return Response.json({
            ...authenticationParameters,
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    } catch (error: any) {
        console.error('Error generating ImageKit auth:', error);
        return Response.json(
            { error: 'Failed to generate authentication' },
            { status: 500 }
        );
    }
}
```

---

### 6. Database Schema

Define your database tables to store file metadata:

**Example Prisma Schema:**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  photos    Photo[]
  // ... other fields
}

model Photo {
  id                Int      @id @default(autoincrement())
  userId            Int
  user              User     @relation(fields: [userId], references: [id])
  
  // ImageKit fields
  imagekitFileId    String   @unique  // For deletion
  imagekitFilePath  String              // Full path in ImageKit
  
  // File metadata
  originalFilename  String
  fileSize          Int
  mimeType          String
  width             Int?
  height            Int?
  
  // Optional relationships (managed in DB, not folders!)
  locationId        Int?
  albumId           Int?
  
  // Display metadata
  caption           String?
  isPrimary         Boolean  @default(false)
  sortOrder         Int      @default(0)
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId])
  @@index([locationId])
}
```

---

### 7. Client-Side Upload Component

**File:** `src/components/ImageUploader.tsx`

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FOLDER_PATHS } from '@/lib/constants/upload';

interface UploadedPhoto {
    imagekitFileId: string;
    imagekitFilePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    url: string;
}

export function ImageUploader({ userId }: { userId: number }) {
    const [uploading, setUploading] = useState(false);
    const [photos, setPhotos] = useState<UploadedPhoto[]>([]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            // Step 1: Get authentication from your API
            const authResponse = await fetch('/api/imagekit/auth');
            if (!authResponse.ok) throw new Error('Failed to authenticate');
            
            const authData = await authResponse.json();

            // Step 2: Upload each file to ImageKit
            const uploadPromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                
                // File and metadata
                formData.append('file', file);
                formData.append('fileName', file.name.replace(/\s+/g, '-'));
                formData.append('folder', FOLDER_PATHS.userPhotos(userId));
                
                // Authentication parameters
                formData.append('publicKey', authData.publicKey);
                formData.append('signature', authData.signature);
                formData.append('expire', authData.expire.toString());
                formData.append('token', authData.token);

                // Upload to ImageKit
                const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Upload failed');
                }

                const result = await uploadResponse.json();

                return {
                    imagekitFileId: result.fileId,
                    imagekitFilePath: result.filePath,
                    originalFilename: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    width: result.width,
                    height: result.height,
                    url: result.url,
                };
            });

            const uploadedPhotos = await Promise.all(uploadPromises);
            
            // Step 3: Save metadata to your database
            await fetch('/api/photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photos: uploadedPhotos }),
            });

            setPhotos([...photos, ...uploadedPhotos]);
            toast.success(`${uploadedPhotos.length} photo(s) uploaded`);
            
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
            />
            
            {uploading && <p>Uploading...</p>}
            
            <div className="grid grid-cols-3 gap-4 mt-4">
                {photos.map((photo, index) => (
                    <img
                        key={index}
                        src={photo.url}
                        alt={photo.originalFilename}
                        className="w-full h-40 object-cover rounded"
                    />
                ))}
            </div>
        </div>
    );
}
```

---

### 8. Server-Side Upload (Alternative)

For server-side uploads (e.g., avatar processing):

**File:** `src/app/api/upload/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { uploadToImageKit } from '@/lib/imagekit';
import { FOLDER_PATHS } from '@/lib/constants/upload';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        // const user = await getUserFromRequest(request);
        const userId = 1; // Replace with actual user ID

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file
        if (!file.type.startsWith('image/')) {
            return Response.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Convert to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to ImageKit
        const uploadResult = await uploadToImageKit({
            file: buffer,
            fileName: `photo-${userId}-${Date.now()}`,
            folder: FOLDER_PATHS.userPhotos(userId),
            tags: ['user-upload', `user-${userId}`],
        });

        if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
        }

        // Save to database
        // await db.photo.create({
        //     data: {
        //         userId,
        //         imagekitFileId: uploadResult.fileId,
        //         imagekitFilePath: uploadResult.url,
        //         // ... other fields
        //     }
        // });

        return Response.json({
            success: true,
            url: uploadResult.url,
            fileId: uploadResult.fileId,
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return Response.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}
```

---

### 9. Image Transformations

ImageKit supports URL-based transformations:

```typescript
/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'auto' | 'webp' | 'jpg' | 'png';
    } = {}
): string {
    const transformations: string[] = [];

    if (options.width) transformations.push(`w-${options.width}`);
    if (options.height) transformations.push(`h-${options.height}`);
    if (options.quality) transformations.push(`q-${options.quality}`);
    if (options.format) transformations.push(`f-${options.format}`);

    // Default: maintain aspect ratio
    transformations.push('c-at_max');

    if (transformations.length === 0) return url;

    return `${url}?tr=${transformations.join(',')}`;
}

// Usage:
// const thumbnail = getOptimizedImageUrl(photo.url, {
//     width: 400,
//     height: 300,
//     quality: 80,
//     format: 'auto'
// });
```

**Common Transformations:**
- `w-400` - Width 400px
- `h-300` - Height 300px
- `c-at_max` - Maintain aspect ratio, fit within bounds
- `q-80` - 80% quality
- `f-auto` - Auto format (WebP for modern browsers)
- `fo-auto` - Auto focus (smart cropping)

---

### 10. File Deletion

When deleting files, clean up both ImageKit and database:

```typescript
/**
 * Delete photo from both ImageKit and database
 */
export async function deletePhoto(photoId: number) {
    try {
        // 1. Get photo from database
        const photo = await db.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            throw new Error('Photo not found');
        }

        // 2. Delete from ImageKit
        const deleteResult = await deleteFromImageKit(photo.imagekitFileId);
        
        if (!deleteResult.success) {
            console.error('ImageKit deletion failed:', deleteResult.error);
            // Decide: continue with DB deletion or abort?
        }

        // 3. Delete from database
        await db.photo.delete({
            where: { id: photoId },
        });

        return { success: true };
        
    } catch (error) {
        console.error('Delete photo error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}
```

---

## Folder Structure Examples

### Development Environment
```
/development/
  ├── users/
  │   ├── 1/
  │   │   ├── photos/
  │   │   │   ├── photo-1-1234567890.jpg
  │   │   │   └── photo-1-1234567891.jpg
  │   │   └── avatars/
  │   │       └── avatar-1-1234567892.jpg
  │   └── 2/
  │       └── photos/
  │           └── photo-2-1234567893.jpg
```

### Production Environment
```
/production/
  ├── users/
  │   ├── 1/
  │   │   ├── photos/
  │   │   └── avatars/
  │   └── 2/
```

---

## Testing Checklist

### ✅ Configuration
- [ ] Environment variables set locally (`.env.local`)
- [ ] Environment variables set in production (Vercel/hosting)
- [ ] ImageKit credentials correct (test in dashboard)
- [ ] URL endpoint accessible

### ✅ Upload Flow
- [ ] Client-side upload works
- [ ] Server-side upload works
- [ ] Files appear in ImageKit dashboard
- [ ] Database records created correctly
- [ ] File paths stored correctly

### ✅ Retrieval
- [ ] Image URLs work in browser
- [ ] Transformations work (resize, format)
- [ ] Private files protected (if applicable)

### ✅ Deletion
- [ ] Files deleted from ImageKit
- [ ] Database records removed
- [ ] Orphaned files cleaned up

---

## Security Best Practices

### 1. Authentication
```typescript
// Always verify user before generating auth
export async function GET(request: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate auth...
}
```

### 2. Validation
```typescript
// Validate file type and size
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
}

if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
}
```

### 3. Folder Access
```typescript
// Only allow users to upload to their own folder
const uploadFolder = FOLDER_PATHS.userPhotos(authenticatedUser.id);

// NEVER trust client-provided folder paths
// ❌ formData.get('folder') - DANGEROUS!
// ✅ FOLDER_PATHS.userPhotos(authenticatedUser.id)
```

### 4. Private Keys
```typescript
// ✅ GOOD: Private key stays server-side
const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // Server-only
});

// ❌ BAD: Never expose private key to client
// Don't use NEXT_PUBLIC_ prefix for private keys
```

---

## Performance Optimization

### 1. Lazy Loading
```typescript
// Load images as user scrolls
<img 
    src={photo.url} 
    loading="lazy" 
    alt={photo.caption}
/>
```

### 2. Responsive Images
```typescript
// Serve different sizes for different screens
<img 
    src={getOptimizedImageUrl(photo.url, { width: 400 })}
    srcSet={`
        ${getOptimizedImageUrl(photo.url, { width: 400 })} 400w,
        ${getOptimizedImageUrl(photo.url, { width: 800 })} 800w,
        ${getOptimizedImageUrl(photo.url, { width: 1200 })} 1200w
    `}
    sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
/>
```

### 3. Compression
```typescript
// Client-side compression before upload
async function compressImage(file: File, maxSizeMB: number): Promise<Blob> {
    // Use canvas or library like browser-image-compression
    // See fotolokashen implementation for full example
}
```

---

## Troubleshooting

### Issue: "Authentication failed"
**Solution:** Check that:
- Private key is correct in environment variables
- Auth endpoint returns valid signature
- Token hasn't expired (5-minute window)

### Issue: "Upload fails with CORS error"
**Solution:** 
- ImageKit automatically handles CORS
- Ensure you're using signed authentication
- Check browser console for specific error

### Issue: "Files not appearing in folder"
**Solution:**
- Verify folder path format: `/development/users/1/photos`
- Check ImageKit dashboard → Media Library
- Ensure upload completed successfully (check response)

### Issue: "Images load slowly"
**Solution:**
- Use transformations to reduce file size
- Enable lazy loading
- Use `format: 'auto'` for automatic WebP conversion
- Consider CDN caching headers

---

## Migration from Existing System

### Step 1: Audit Current Files
```typescript
// List all files in current system
const currentFiles = await getCurrentFileList();

// Map to new structure
const migrationPlan = currentFiles.map(file => ({
    oldPath: file.path,
    newPath: FOLDER_PATHS.userPhotos(file.userId),
    fileId: file.id,
}));
```

### Step 2: Move Files
```typescript
// Use ImageKit API to move files
for (const item of migrationPlan) {
    await imagekit.moveFile({
        sourceFilePath: item.oldPath,
        destinationPath: item.newPath,
    });
}
```

### Step 3: Update Database
```typescript
// Update file paths in database
await db.photo.updateMany({
    data: migrationPlan.map(item => ({
        where: { id: item.fileId },
        data: { imagekitFilePath: item.newPath },
    })),
});
```

---

## Cost Optimization

### Free Tier Limits (ImageKit)
- 20 GB bandwidth/month
- 20 GB storage
- Unlimited transformations

### Tips to Stay Within Free Tier
1. **Compress before upload** - Reduce storage and bandwidth
2. **Delete unused files** - Clean up test/temporary files
3. **Use transformations** - Don't store multiple sizes
4. **Cache aggressively** - Reduce transformation requests

---

## Additional Resources

- **ImageKit Docs**: https://docs.imagekit.io
- **Transformation Reference**: https://docs.imagekit.io/features/image-transformations
- **API Reference**: https://docs.imagekit.io/api-reference
- **fotolokashen Implementation**: See `src/lib/imagekit.ts` for full examples

---

## Summary

This implementation provides:
- ✅ **Flat folder structure** for scalability
- ✅ **Environment separation** (dev/prod)
- ✅ **Database-driven relationships** (not folder-based)
- ✅ **Client and server upload methods**
- ✅ **Secure authentication**
- ✅ **Image transformations**
- ✅ **Easy deletion and cleanup**

**Key Principle:** Store files simply in ImageKit, manage complexity in your database.

---

*Generated from fotolokashen ImageKit implementation - January 2026*
