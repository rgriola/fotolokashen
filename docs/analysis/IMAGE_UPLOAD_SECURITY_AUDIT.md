# Image Upload Security Audit & Uniform Security Implementation
**Date:** February 12, 2026  
**Status:** 🔴 CRITICAL SECURITY ISSUES FOUND  
**Affected Systems:** Location photos, create-with-photo workflow

---

## 🎯 Executive Summary

**Finding:** The application has **inconsistent security** across image upload paths. Avatar and banner uploads are properly secured with virus scanning, but **location photo uploads bypass all server-side security**.

### Allowed Image Formats

**Supported Types:** JPEG, HEIC, TIFF  
**Allowed Extensions:** `.jpg`, `.jpeg`, `.JPG`, `.JPEG`, `.heic`, `.HEIC`, `.tif`, `.tiff`, `.TIF`, `.TIFF`

**File Extension Notes:**
- `.jpg` and `.jpeg` are identical (JPEG format) - extension case-insensitive
- `.heic` - High Efficiency Image Container (Apple's modern format)
- `.tif` and `.tiff` are identical (TIFF format) - extension case-insensitive

**Compression Strategy:**
- **Location photos:** Compress to max 2MB while preserving original dimensions
- **Avatar:** Resize to 512x512px, compress to max 1MB
- **Banner:** Resize to max 1920x600px, compress to max 2MB
- Format conversion: HEIC/TIFF → JPEG for web compatibility
- Quality: Adaptive (start at 90%, reduce to meet size target)

### Security Status by Upload Type

| Upload Type | Endpoint/Component | Virus Scan | Server Validation | Metadata Sanitization | Status |
|-------------|-------------------|------------|-------------------|----------------------|--------|
| **Avatar** | `/api/auth/avatar` | ✅ Yes | ✅ Yes | N/A | ✅ **SECURE** |
| **Banner** | `/api/auth/banner` | ✅ Yes | ✅ Yes | N/A | ✅ **SECURE** |
| **Create-with-Photo** | PhotoLocationForm | ❌ No | ❌ No | ❌ No | 🔴 **INSECURE** |
| **Save Location (New)** | ImageKitUploader | ❌ No | ❌ No | ❌ No | 🔴 **INSECURE** |
| **Edit Location (Add Photos)** | ImageKitUploader | ❌ No | ❌ No | ❌ No | 🔴 **INSECURE** |

### Architecture Patterns

**✅ SECURE PATTERN (Avatar/Banner):**
```
Client → Server API → Virus Scan → Server Upload to CDN → Database
```

**🔴 INSECURE PATTERN (Location Photos):**
```
Client → ImageKit CDN (direct) → Database (metadata only) ⚠️ BYPASSES SERVER
```

---

## 📍 All Image Upload Paths

### 1. Avatar Upload ✅ **SECURE**

**User Flow:**
1. User clicks avatar → Opens image editor
2. Crops/edits image → Saves
3. Triggers client upload to trigger endpoint

**Security Implementation:**

**Client:** `/src/components/profile/AvatarUpload.tsx`
```typescript
const handleEditorSave = async (croppedBlob: Blob, fileName: string) => {
  // Convert blob to file
  const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
  
  // Trigger ImageKit upload via hidden input
  // Upload goes to ImageKit, then calls POST /api/auth/avatar
};
```

**Server:** `/src/app/api/auth/avatar/route.ts`
```typescript
export async function POST(request: NextRequest) {
  // 1. Get file from FormData OR JSON (ImageKit result)
  const file = formData.get('avatar') as File;
  
  // 2. Validate type
  if (!file.type.startsWith('image/')) {
    return apiError('File must be an image', 400);
  }
  
  // 3. Validate size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return apiError('File size must be less than 5MB', 400);
  }
  
  // 4. Convert to buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // 5. ✅ VIRUS SCAN
  const scanResult = await scanFile(buffer, file.name);
  if (scanResult.isInfected) {
    return apiError('File failed security scan', 400);
  }
  
  // 6. Upload to ImageKit
  const uploadResult = await uploadToImageKit({
    file: buffer,
    fileName: `avatar-${user.id}-${Date.now()}`,
    folder: FOLDER_PATHS.userAvatars(user.id),
  });
  
  // 7. Delete old avatar
  if (currentUser?.avatarFileId) {
    await deleteFromImageKit(currentUser.avatarFileId);
  }
  
  // 8. Save to database
  await prisma.user.update({
    where: { id: user.id },
    data: { avatar: uploadResult.url, avatarFileId: uploadResult.fileId },
  });
}
```

**Security Features:**
- ✅ Server-side file type validation
- ✅ Server-side file size validation (5MB)
- ✅ Virus scanning with ClamAV
- ✅ Automatic old file deletion
- ✅ Server controls upload to CDN

---

### 2. Banner Upload ✅ **SECURE**

**User Flow:**
1. User clicks "Edit Banner"
2. Selects image file
3. Uploads to server endpoint

**Security Implementation:**

**Client:** `/src/components/profile/BannerUpload.tsx`
```typescript
// Uses ImageKit IKUpload component
<IKUpload
  fileName={`banner-${user?.id}-${Date.now()}`}
  folder={getImageKitFolder(`users/${user?.id}/banners`)}
  onSuccess={async (res) => {
    // After ImageKit upload, notify server
    await fetch('/api/auth/banner', {
      method: 'POST',
      body: JSON.stringify({
        bannerUrl: res.url,
        fileId: res.fileId,
      }),
    });
  }}
/>
```

**Server:** `/src/app/api/auth/banner/route.ts`
```typescript
export async function POST(request: NextRequest) {
  // Accepts BOTH FormData (direct upload) AND JSON (ImageKit result)
  
  if (contentType?.includes('application/json')) {
    // ImageKit already uploaded - just save URL
    const { bannerUrl, fileId } = await request.json();
  } else {
    // Traditional FormData upload
    const file = formData.get('banner') as File;
    
    // 1. Validate type
    if (!file.type.startsWith('image/')) {
      return apiError('File must be an image', 400);
    }
    
    // 2. Validate size (10MB max for banners)
    if (file.size > 10 * 1024 * 1024) {
      return apiError('File size must be less than 10MB', 400);
    }
    
    // 3. ✅ VIRUS SCAN
    const buffer = Buffer.from(await file.arrayBuffer());
    const scanResult = await scanFile(buffer, file.name);
    if (scanResult.isInfected) {
      return apiError('File failed security scan', 400);
    }
    
    // 4. Upload to ImageKit
    const uploadResult = await uploadToImageKit({
      file: buffer,
      fileName: `banner-${user.id}-${Date.now()}`,
      folder: getImageKitFolder(`users/${user.id}/banners`),
    });
  }
  
  // Delete old banner
  if (currentUser?.bannerFileId) {
    await deleteFromImageKit(currentUser.bannerFileId);
  }
  
  // Save to database
  await prisma.user.update({
    where: { id: user.id },
    data: { bannerImage: bannerUrl, bannerFileId: fileId },
  });
}
```

**Security Features:**
- ✅ Server-side file type validation 
- ✅ Server-side file size validation (10MB)
- ✅ Virus scanning with ClamAV 
- ✅ Automatic old file deletion
- ✅ Dual mode (FormData or JSON) - both secure 

**Note:** This endpoint accepts ImageKit uploads that already happened on the client, but also supports direct FormData uploads which are properly scanned. **However, the client component only uses the ImageKit direct upload path, which bypasses the virus scanning.**

---

### 3. Create-with-Photo Upload 🔴 **INSECURE**

**User Flow:**
1. User navigates to `/create-with-photo`
2. Selects photo with GPS data
3. GPS extracted from EXIF
4. Form displayed with location details
5. User clicks "Save Location with GPS Photo"
6. **Photo uploads DIRECTLY to ImageKit CDN** ⚠️
7. Server receives only ImageKit fileId (no file validation)

**Security Implementation:**

**Client:** `/src/components/locations/PhotoLocationForm.tsx`
```typescript
const handleSubmit = async (data: LocationFormData) => {
  // Step 1: Get ImageKit auth
  const authResponse = await fetch('/api/imagekit/auth');
  const authData = await authResponse.json();

  // Step 2: Upload DIRECTLY to ImageKit (BYPASSES SERVER) ⚠️
  const formData = new FormData();
  formData.append('file', photoFile);
  formData.append('fileName', photoFile.name);
  formData.append('folder', FOLDER_PATHS.userPhotos(user.id));
  formData.append('publicKey', authData.publicKey);
  formData.append('signature', authData.signature);
  formData.append('expire', authData.expire.toString());
  formData.append('token', authData.token);

  // ⚠️ DIRECT UPLOAD - NO SERVER VALIDATION
  const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  const uploadResult = await uploadResponse.json();

  // Step 3: Send only metadata to server (no file validation)
  const photoData = {
    fileId: uploadResult.fileId,
    filePath: uploadResult.filePath,
    // EXIF metadata (UNSANITIZED) ⚠️
    cameraMake: photoMetadata.camera?.make || null,
    cameraModel: photoMetadata.camera?.model || null,
    // ... more unsanitized fields
  };

  await fetch('/api/locations', {
    method: 'POST',
    body: JSON.stringify({
      ...locationData,
      photos: [photoData],
    }),
  });
};
```

**Server:** `/src/app/api/locations/route.ts`
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Create location
  const location = await prisma.location.create({ data: {...} });
  
  // Save photos (if provided)
  if (body.photos && body.photos.length > 0) {
    await prisma.photo.createMany({
      data: body.photos.map((photo) => ({
        locationId: location.id,
        userId: user.id,
        imagekitFileId: photo.imagekitFileId || photo.fileId,
        // METADATA NOT SANITIZED ⚠️
        cameraMake: photo.cameraMake || null,
        cameraModel: photo.cameraModel || null,
        exposureMode: photo.exposureMode || null,
        // ... all EXIF fields go directly to DB
      })),
    });
  }
}
```

**Security Vulnerabilities:**

❌ **No virus scanning** - Files upload directly to CDN  
❌ **No file type validation** - Malicious files can be uploaded  
❌ **No file size validation** - Can upload huge files  
❌ **No metadata sanitization** - EXIF data can contain XSS payloads  
❌ **Bypasses all server security** - Server never sees the actual file

**Attack Scenarios:**

1. **Malware Distribution:**
   ```
   Attacker uploads malware.exe renamed as photo.jpg
   → ImageKit hosts it permanently
   → Shared via URL → Infects victims
   ```

2. **XSS via EXIF:**
   ```
   Photo with EXIF: Make: "<script>alert('XSS')</script>"
   → Saved to database unsanitized
   → Displayed on page → XSS executes
   ```

3. **Storage Abuse:**
   ```
   Attacker uploads 100x 10MB photos
   → No server validation
   → Storage costs skyrocket
   ```

---

### 4. Save Location (New) with Photos 🔴 **INSECURE**

**User Flow:**
1. User clicks "Add Location" on map
2. Fills location form
3. Optionally adds photos via `ImageKitUploader`
4. Clicks "Save Location"

**Security Implementation:**

**Client:** `/src/components/locations/SaveLocationForm.tsx`
```typescript
// Uses ImageKitUploader in "deferred" mode
<ImageKitUploader
  uploadMode="deferred"
  onCachedPhotosChange={setCachedPhotos}
  onUploadReady={(uploadFn) => {
    uploadPhotosRef.current = uploadFn;
  }}
/>

const handleSubmit = async (data) => {
  // Upload cached photos to ImageKit
  const uploadedPhotos = await uploadPhotosRef.current();
  
  // Send to server
  await fetch('/api/locations', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      photos: uploadedPhotos, // Only metadata, no file validation
    }),
  });
};
```

**Client:** `/src/components/ui/ImageKitUploader.tsx`
```typescript
// DEFERRED MODE: Cache photos, upload on save
const uploadToImageKit = async (file: File) => {
  // ⚠️ NO FILE TYPE VALIDATION
  // ⚠️ NO VIRUS SCANNING
  
  // Compress image client-side
  const compressedBlob = await compressImage(file, maxFileSize);
  
  // Get auth
  const authParams = await getAuthParams();
  
  // Upload DIRECTLY to ImageKit
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('folder', FOLDER_PATHS.userPhotos(user.id));
  // ... auth params
  
  const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });
  
  return uploadResponse.json(); // Returns fileId for server
};
```

**Server:** Same as Create-with-Photo (no validation)

**Security Vulnerabilities:**

❌ **No virus scanning**  
❌ **No file type validation** (only client-side checks)  
❌ **No file size enforcement** (compression is optional)  
❌ **Direct CDN upload** - server never sees file

---

### 5. Edit Location (Add Photos) 🔴 **INSECURE**

**User Flow:**
1. User opens location in edit mode
2. Adds more photos via `ImageKitUploader`
3. Clicks "Save Changes"

**Security Implementation:**

**Client:** `/src/components/locations/EditLocationForm.tsx`
```typescript
// Same as SaveLocationForm - uses ImageKitUploader
<ImageKitUploader
  uploadMode="deferred"
  existingPhotos={location.photos}
  onCachedPhotosChange={setCachedPhotos}
  onUploadReady={(uploadFn) => {
    uploadPhotosRef.current = uploadFn;
  }}
/>
```

**Same vulnerabilities as Save Location.**

---

## 🔍 Root Cause Analysis

### Why Are Location Uploads Insecure?

**Historical Context:**
1. Avatar/Banner were implemented first with proper security
2. Location photos added later using ImageKit's client SDK for "better UX"
3. Direct client-to-CDN upload pattern adopted without security review
4. No virus scanning integration for client-side uploads

### Pattern Comparison

**Avatar/Banner (Secure):**
```typescript
// Pattern: Server-mediated upload
Client File → Server API → Virus Scan → Upload to CDN → Database
```

**Location Photos (Insecure):**
```typescript
// Pattern: Client-direct upload
Client File → CDN (direct) → Database (metadata only)
               ↑
         NO SERVER VALIDATION
```

### Why This Happened

1. **ImageKit SDK Usage:**
   - `IKUpload` component encourages client-direct uploads
   - "Easier" to implement (less server code)
   - Deferred ImageKit's own server-side validation (which we don't control)

2. **Feature Development Speed:**
   - Location photos added as enhancement
   - Focus on UX (drag-drop, compression) over security
   - Security pattern not consistently applied

3. **Lack of Security Review:**
   - No checklist for new upload features
   - No requirement to match existing patterns
   - Copilot instructions mention virus scanning but not enforced

---

## ✅ Recommended Solution: Uniform Security Layer

### Approach: **Server-Side Upload API for All Photo Types**

Create a **single, secure endpoint** that all photo uploads must go through.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT                                                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Avatar     │    │   Banner     │    │   Location   │     │
│  │   Upload     │    │   Upload     │    │    Photos    │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                   │              │
│         └───────────────────┴───────────────────┘              │
│                             │                                  │
│                   FormData: file + metadata                    │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER: /api/photos/upload (UNIFIED SECURE ENDPOINT)           │
│                                                                 │
│  1. ✅ Authenticate user                                        │
│  2. ✅ Validate file type (server-side)                        │
│  3. ✅ Validate file size (server-side)                        │
│  4. ✅ Convert to buffer                                        │
│  5. ✅ VIRUS SCAN with ClamAV                                   │
│  6. ✅ Optional: Compress image                                 │
│  7. ✅ Sanitize metadata (if provided)                          │
│  8. ✅ Upload to ImageKit                                       │
│  9. ✅ Return secure upload result                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  ImageKit CDN    │
                    │  (Verified File) │
                    └──────────────────┘
```

---

## 📝 Implementation Plan

### Phase 1: Create Unified Upload Endpoint (Week 1)

#### 1.1 Create `/api/photos/upload` Route

**File:** `/src/app/api/photos/upload/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { uploadToImageKit } from '@/lib/imagekit';
import { scanFile } from '@/lib/virus-scan';
import { sanitizeText } from '@/lib/sanitize';
import { FILE_SIZE_LIMITS, FOLDER_PATHS } from '@/lib/constants/upload';
import prisma from '@/lib/prisma';

/**
 * POST /api/photos/upload
 * Unified secure photo upload endpoint for ALL photo types
 * 
 * Body (FormData):
 * - photo: File (required)
 * - uploadType: 'location' | 'avatar' | 'banner' (required)
 * - metadata: JSON string (optional - for GPS/EXIF data)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth(request);
    if (!authResult.authorized || !authResult.user) {
      return apiError('Authentication required', 401);
    }
    const user = authResult.user;

    // 2. Extract form data
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    const uploadType = formData.get('uploadType') as string;
    const metadataJson = formData.get('metadata') as string | null;

    // 3. Validate required fields
    if (!file) {
      return apiError('No file provided', 400, 'NO_FILE');
    }

    if (!uploadType || !['location', 'avatar', 'banner'].includes(uploadType)) {
      return apiError('Invalid uploadType', 400, 'INVALID_TYPE');
    }

    // 4. Validate file type (server-side - can't be bypassed)
    // Allowed formats: JPEG, HEIC, TIFF
    const allowedMimeTypes = [
      'image/jpeg',      // .jpg, .jpeg
      'image/heic',      // .heic (Apple)
      'image/heif',      // .heif (HEIC variant)
      'image/tiff',      // .tif, .tiff
    ];
    
    // Also check file extension as fallback (case-insensitive)
    const allowedExtensions = [
      '.jpg', '.jpeg', '.JPG', '.JPEG',
      '.heic', '.HEIC',
      '.tif', '.tiff', '.TIF', '.TIFF',
    ];
    
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const isValidMimeType = allowedMimeTypes.includes(file.type.toLowerCase());
    const isValidExtension = allowedExtensions.includes(fileExtension);
    
    if (!isValidMimeType && !isValidExtension) {
      console.warn(`[Photo Upload] REJECTED: Invalid file type: ${file.type}, extension: ${fileExtension}`);
      return apiError(
        'File must be JPEG, HEIC, or TIFF format',
        400,
        'INVALID_FILE_TYPE'
      );
    }
    
    // Log HEIC uploads for monitoring
    if (file.type.includes('heic') || file.type.includes('heif') || fileExtension.toLowerCase().includes('heic')) {
      console.log(`[Photo Upload] HEIC format detected: ${file.name}`);
    }

    // 5. Validate file size based on type
    const maxSize = uploadType === 'location' 
      ? FILE_SIZE_LIMITS.PHOTO 
      : uploadType === 'banner'
        ? 10
        : FILE_SIZE_LIMITS.AVATAR;
    
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      console.warn(`[Photo Upload] REJECTED: File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max ${maxSize}MB)`);
      return apiError(
        `File size must be less than ${maxSize}MB`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    // 6. Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[Photo Upload] Processing ${file.name} (${(buffer.length / 1024).toFixed(2)} KB)`);

    // 7. 🔐 VIRUS SCAN (CRITICAL SECURITY CHECK)
    console.log(`[Photo Upload] Scanning ${file.name} for viruses...`);
    const scanResult = await scanFile(buffer, file.name);
    
    if (scanResult.isInfected) {
      console.error(`[Photo Upload] 🚨 INFECTED: ${file.name}`, scanResult.viruses);
      
      // Log security event
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'PHOTO_UPLOAD_BLOCKED',
          details: `Virus detected in ${uploadType} photo: ${scanResult.viruses?.join(', ')}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      });

      return apiError(
        scanResult.error || 'File failed security scan',
        400,
        'SECURITY_VIOLATION'
      );
    }

    console.log(`[Photo Upload] ✅ File clean: ${file.name}`);

    // 8. Process image: Compression & format conversion
    let processedBuffer = buffer;
    let finalMimeType = file.type;
    
    // Convert HEIC/TIFF to JPEG for web compatibility
    const needsConversion = file.type.includes('heic') || 
                           file.type.includes('heif') || 
                           file.type.includes('tiff');
    
    if (needsConversion) {
      console.log(`[Photo Upload] Converting ${file.type} to JPEG...`);
      try {
        // Use Sharp library for image processing
        const sharp = require('sharp');
        
        // Convert to JPEG, preserve dimensions
        processedBuffer = await sharp(buffer)
          .jpeg({ quality: 90 }) // High quality for initial conversion
          .toBuffer();
        
        finalMimeType = 'image/jpeg';
        console.log(`[Photo Upload] ✅ Converted to JPEG (${(processedBuffer.length / 1024).toFixed(2)} KB)`);
      } catch (error) {
        console.error(`[Photo Upload] Conversion failed:`, error);
        // Continue with original buffer if conversion fails
      }
    }
    
    // Compress if needed to meet size targets
    const targetSize = uploadType === 'location' ? 2 : uploadType === 'banner' ? 2 : 1; // MB
    const currentSizeMB = processedBuffer.length / (1024 * 1024);
    
    if (currentSizeMB > targetSize) {
      console.log(`[Photo Upload] Compressing ${file.name} from ${currentSizeMB.toFixed(2)}MB to ${targetSize}MB...`);
      try {
        const sharp = require('sharp');
        
        // Get image metadata to preserve dimensions
        const metadata = await sharp(processedBuffer).metadata();
        const originalWidth = metadata.width;
        const originalHeight = metadata.height;
        
        console.log(`[Photo Upload] Original dimensions: ${originalWidth}x${originalHeight}`);
        
        // Compress with adaptive quality
        let quality = 90;
        let compressed = processedBuffer;
        
        // Try compression at different quality levels
        while (quality >= 60 && compressed.length > targetSize * 1024 * 1024) {
          compressed = await sharp(processedBuffer)
            .resize(originalWidth, originalHeight, { // Preserve dimensions
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality })
            .toBuffer();
          
          const compressedSizeMB = compressed.length / (1024 * 1024);
          console.log(`[Photo Upload] Quality ${quality}%: ${compressedSizeMB.toFixed(2)}MB`);
          
          if (compressedSizeMB <= targetSize) {
            processedBuffer = compressed;
            console.log(`[Photo Upload] ✅ Compressed to ${compressedSizeMB.toFixed(2)}MB at ${quality}% quality`);
            break;
          }
          
          quality -= 10;
        }
        
        // If still too large, reduce dimensions slightly
        if (processedBuffer.length > targetSize * 1024 * 1024) {
          const scaleFactor = 0.9;
          const newWidth = Math.round(originalWidth! * scaleFactor);
          const newHeight = Math.round(originalHeight! * scaleFactor);
          
          console.log(`[Photo Upload] Reducing dimensions to ${newWidth}x${newHeight}...`);
          
          processedBuffer = await sharp(processedBuffer)
            .resize(newWidth, newHeight)
            .jpeg({ quality: 85 })
            .toBuffer();
          
          console.log(`[Photo Upload] ✅ Final size: ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        }
        
      } catch (error) {
        console.error(`[Photo Upload] Compression failed:`, error);
        // Continue with uncompressed if compression fails
      }
    }

    // 9. Determine upload folder based on type
    let uploadFolder: string;
    let fileName: string;
    
    switch (uploadType) {
      case 'avatar':
        uploadFolder = FOLDER_PATHS.userAvatars(user.id);
        fileName = `avatar-${user.id}-${Date.now()}`;
        break;
      case 'banner':
        uploadFolder = FOLDER_PATHS.userAvatars(user.id).replace('/avatars', '/banners');
        fileName = `banner-${user.id}-${Date.now()}`;
        break;
      case 'location':
      default:
        uploadFolder = FOLDER_PATHS.userPhotos(user.id);
        fileName = `photo-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    }

    // 10. Upload to ImageKit (with processed buffer)
    console.log(`[Photo Upload] Uploading to ImageKit: ${uploadFolder}/${fileName}`);
    const uploadResult = await uploadToImageKit({
      file: processedBuffer, // Use processed/compressed buffer
      fileName,
      folder: uploadFolder,
      tags: [uploadType, `user-${user.id}`],
    });

    if (!uploadResult.success || !uploadResult.url) {
      console.error(`[Photo Upload] ImageKit upload failed:`, uploadResult.error);
      return apiError('Failed to upload to CDN', 500, 'CDN_ERROR');
    }

    console.log(`[Photo Upload] ✅ Upload successful: ${uploadResult.filePath}`);

    // 11. Sanitize metadata (for location photos with GPS/EXIF data)
    let sanitizedMetadata = null;
    
    if (metadataJson && uploadType === 'location') {
      try {
        const metadata = JSON.parse(metadataJson);
        
        // Sanitize all text fields that go to database
        sanitizedMetadata = {
          // GPS data (numbers - safe)
          hasGPS: Boolean(metadata.hasGPS),
          gpsLatitude: typeof metadata.lat === 'number' ? metadata.lat : null,
          gpsLongitude: typeof metadata.lng === 'number' ? metadata.lng : null,
          gpsAltitude: typeof metadata.altitude === 'number' ? metadata.altitude : null,
          
          // Date (convert to ISO string)
          dateTaken: metadata.dateTaken ? new Date(metadata.dateTaken).toISOString() : null,
          
          // Camera info (SANITIZE - can contain malicious strings)
          cameraMake: metadata.camera?.make ? sanitizeText(metadata.camera.make) : null,
          cameraModel: metadata.camera?.model ? sanitizeText(metadata.camera.model) : null,
          lensMake: metadata.lens?.make ? sanitizeText(metadata.lens.make) : null,
          lensModel: metadata.lens?.model ? sanitizeText(metadata.lens.model) : null,
          
          // Numeric values (safe, but validate type)
          iso: typeof metadata.iso === 'number' ? metadata.iso : null,
          orientation: typeof metadata.orientation === 'number' ? metadata.orientation : null,
          
          // String values (SANITIZE)
          focalLength: metadata.focalLength ? sanitizeText(metadata.focalLength) : null,
          aperture: metadata.aperture ? sanitizeText(metadata.aperture) : null,
          exposureTime: metadata.exposureTime ? sanitizeText(metadata.exposureTime) : null,
          exposureMode: metadata.exposureMode ? sanitizeText(metadata.exposureMode) : null,
          whiteBalance: metadata.whiteBalance ? sanitizeText(metadata.whiteBalance) : null,
          flash: metadata.flash ? sanitizeText(metadata.flash) : null,
          colorSpace: metadata.colorSpace ? sanitizeText(metadata.colorSpace) : null,
        };
        
        console.log(`[Photo Upload] Metadata sanitized for ${file.name}`);
      } catch (error) {
        console.error(`[Photo Upload] Failed to parse metadata:`, error);
        // Continue without metadata rather than failing upload
      }
    }

    // 12. Return upload result
    const response = {
      upload: {
        fileId: uploadResult.fileId,
        filePath: uploadResult.filePath,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        width: uploadResult.width,
        height: uploadResult.height,
      },
      file: {
        originalFilename: file.name,
        size: buffer.length,
        mimeType: file.type,
      },
      metadata: sanitizedMetadata,
    };

    return apiResponse(response, 201);

  } catch (error: any) {
    console.error('[Photo Upload] Unexpected error:', error);
    return apiError(
      error.message || 'Upload failed',
      500,
      'UPLOAD_ERROR'
    );
  }
}
```

---

#### 1.2 Image Processing Pipeline

**Required Dependencies:**

Add to `package.json`:
```json
{
  "dependencies": {
    "sharp": "^0.33.0"
  }
}
```

**Installation:**
```bash
npm install sharp
```

**Why Sharp?**
- Fast, high-performance image processing (native C++ bindings)
- Handles HEIC/HEIF format (with libheif support)
- Handles TIFF format
- Precise control over compression and dimensions
- Memory-efficient for large images

**Image Processing Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Receive File                                                 │
│    - Original format: JPEG, HEIC, or TIFF                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Format Check & Conversion                                    │
│    - HEIC/TIFF → JPEG (for web compatibility)                   │
│    - JPEG → No conversion needed                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Get Original Dimensions                                      │
│    - Extract width × height from metadata                       │
│    - Preserve aspect ratio                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Intelligent Compression                                      │
│    Location Photos:                                             │
│      - Target: 2MB max                                          │
│      - Strategy: Preserve full dimensions                       │
│      - Quality: 90% → 60% (adaptive)                           │
│                                                                 │
│    Avatar:                                                      │
│      - Target: 1MB max                                          │
│      - Resize: 512×512px (crop/fit)                            │
│      - Quality: 85%                                             │
│                                                                 │
│    Banner:                                                      │
│      - Target: 2MB max                                          │
│      - Resize: Max 1920×600px (preserve ratio)                 │
│      - Quality: 90%                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Size Check & Fallback                                       │
│    - Still > target? Reduce dimensions by 10%                   │
│    - Repeat if needed                                           │
│    - Minimum quality: 60%                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Output                                                       │
│    - Format: JPEG (web-compatible)                              │
│    - Optimized for web delivery                                 │
│    - Ready for CDN upload                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Why This Strategy?**

| Requirement | Solution | Benefit |
|-------------|----------|---------|
| **Maintain dimensions** | Preserve width×height for location photos | GPS-tagged photos show actual scene dimensions |
| **Web compatibility** | Convert HEIC/TIFF → JPEG | All browsers support JPEG |
| **Storage costs** | Compress to 2MB max | Reduce CDN storage by ~70-80% |
| **Load speed** | JPEG optimization | Faster page loads, better UX |
| **Quality retention** | Adaptive quality (90% → 60%) | Balance between size and visual quality |

**File Extension Handling:**

```typescript
// Extension mapping (case-insensitive)
const extensionToMimeType = {
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.JPG':   'image/jpeg',
  '.JPEG':  'image/jpeg',
  '.heic':  'image/heic',
  '.HEIC':  'image/heic',
  '.tif':   'image/tiff',
  '.tiff':  'image/tiff',
  '.TIF':   'image/tiff',
  '.TIFF':  'image/tiff',
};

// Fallback: Check both MIME type AND extension
// (Some browsers report incorrect MIME types for HEIC/TIFF)
```

**HEIC Format Notes:**

- **What is HEIC?** High Efficiency Image Container (Apple's modern format)
- **Browser Support:** Poor (Safari only on macOS/iOS)
- **Server Support:** Good (Sharp with libheif)
- **Our Strategy:** Convert to JPEG server-side for universal compatibility
- **Benefit:** Users can upload iPhone photos directly, we handle conversion

**Compression Examples:**

```
Original iPhone HEIC: 4.2MB (4032×3024px)
  ↓ Convert to JPEG
  ↓ Compress (quality 90%)
Result: 1.8MB (4032×3024px) ← Dimensions preserved!

Original TIFF scan: 12.5MB (3000×2000px)
  ↓ Convert to JPEG
  ↓ Compress (quality 80%)
Result: 1.9MB (3000×2000px) ← Dimensions preserved!

Original JPEG: 8MB (6000×4000px)
  ↓ Compress (quality 75%)
Result: 1.95MB (6000×4000px) ← Dimensions preserved!
```

---

### Phase 2: Update Client Components (Week 2)

#### 2.1 Update PhotoLocationForm (Create-with-Photo)

**File:** `/src/components/locations/PhotoLocationForm.tsx`

**Before (Insecure):**
```typescript
// OLD: Direct upload to ImageKit
const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
  method: 'POST',
  body: formData,
});
```

**After (Secure):**
```typescript
const handleSubmit = async (data: LocationFormData) => {
  if (!user) {
    toast.error('Please log in to continue');
    return;
  }

  setIsSaving(true);

  try {
    // Step 1: Upload photo via secure server endpoint
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('uploadType', 'location');
    formData.append('metadata', JSON.stringify(photoMetadata)); // GPS/EXIF data

    console.log('[PhotoLocationForm] Uploading photo securely...');
    const uploadResponse = await fetch('/api/photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || 'Upload failed');
    }

    const uploadData = await uploadResponse.json();
    console.log('[PhotoLocationForm] Photo uploaded and scanned:', uploadData);

    // Step 2: Prepare photo data for location save
    const photoData = {
      // ImageKit fields
      fileId: uploadData.upload.fileId,
      filePath: uploadData.upload.filePath,
      url: uploadData.upload.url,
      thumbnailUrl: uploadData.upload.thumbnailUrl,
      name: uploadData.file.originalFilename,
      size: uploadData.file.size,
      type: uploadData.file.mimeType,
      width: uploadData.upload.width,
      height: uploadData.upload.height,
      
      // Use SANITIZED metadata from server
      ...uploadData.metadata,
      
      uploadSource: UPLOAD_SOURCES.PHOTO_GPS,
    };

    // Step 3: Save location with photo
    const { lat, lng, ...rest } = data;
    const apiData = {
      ...rest,
      latitude: lat,
      longitude: lng,
      photos: [photoData],
    };

    const locationResponse = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(apiData),
    });

    if (!locationResponse.ok) {
      const error = await locationResponse.json();
      throw new Error(error.error || 'Failed to save location');
    }

    toast.success('Location created from photo!');
    onSuccess();

  } catch (error: any) {
    console.error('Failed to save location:', error);
    toast.error(error.message || 'Failed to save location');
  } finally {
    setIsSaving(false);
  }
};
```

---

#### 2.2 Update ImageKitUploader Component

**File:** `/src/components/ui/ImageKitUploader.tsx`

**Replace `uploadToImageKit` function:**

```typescript
// Upload photo to server (which handles ImageKit upload)
const uploadToImageKit = async (file: File): Promise<UploadedPhoto> => {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('uploadType', 'location');
    // No metadata for regular photo uploads (GPS/EXIF only for create-with-photo)

    console.log(`[ImageKitUploader] Uploading ${file.name} securely...`);

    // Upload via secure server endpoint
    const uploadResponse = await fetch('/api/photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const uploadData = await uploadResponse.json();
    console.log(`[ImageKitUploader] Upload successful:`, uploadData);

    // Create photo object
    const photo: UploadedPhoto = {
      imagekitFileId: uploadData.upload.fileId,
      imagekitFilePath: uploadData.upload.filePath,
      originalFilename: uploadData.file.originalFilename,
      fileSize: uploadData.file.size,
      mimeType: uploadData.file.mimeType,
      width: uploadData.upload.width,
      height: uploadData.upload.height,
      url: uploadData.upload.url,
    };

    return photo;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

**Changes:**
- ✅ Remove direct ImageKit upload
- ✅ Remove client-side compression (server handles it)
- ✅ Remove auth token fetching
- ✅ Use `/api/photos/upload` endpoint
- ✅ All validation happens server-side

**Update file input accept attribute:**

```typescript
// Update all file inputs to accept JPEG, HEIC, TIFF
<input
  type="file"
  accept="image/jpeg,image/jpg,image/heic,image/heif,image/tiff,.jpg,.jpeg,.JPG,.JPEG,.heic,.HEIC,.tif,.tiff,.TIF,.TIFF"
  onChange={handleFileSelect}
/>

// Or use a constant
const ACCEPTED_IMAGE_FORMATS = 'image/jpeg,image/jpg,image/heic,image/heif,image/tiff,.jpg,.jpeg,.JPG,.JPEG,.heic,.HEIC,.tif,.tiff,.TIF,.TIFF';

<input
  type="file"
  accept={ACCEPTED_IMAGE_FORMATS}
  onChange={handleFileSelect}
/>
```

**Update upload prompt text:**

```typescript
// Old
<p>JPG or HEIC • Max {maxFileSize}MB</p>

// New
<p>JPEG, HEIC, or TIFF • Max {maxFileSize}MB</p>
```

**Client-side format validation (user feedback only):**

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Client-side check for better UX (server will verify again)
  const allowedExtensions = ['.jpg', '.jpeg', '.JPG', '.JPEG', '.heic', '.HEIC', '.tif', '.tiff', '.TIF', '.TIFF'];
  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    toast.error('Please select a JPEG, HEIC, or TIFF image');
    return;
  }
  
  // Show format-specific messages
  if (fileExtension.toLowerCase().includes('heic')) {
    toast.info('HEIC detected - will be converted to JPEG for compatibility');
  }
  if (fileExtension.toLowerCase().includes('tif')) {
    toast.info('TIFF detected - will be converted to JPEG for web');
  }
  
  // Continue with upload...
};
```

---

#### 2.3 Update Avatar Upload (Optional - Already Secure)

Avatar and banner uploads are already secure, but we can optionally migrate them to the unified endpoint for consistency:

**File:** `/src/components/profile/AvatarUpload.tsx`

```typescript
const handleEditorSave = async (croppedBlob: Blob, fileName: string) => {
  try {
    setIsUploading(true);
    
    // Use unified upload endpoint
    const formData = new FormData();
    formData.append('photo', new File([croppedBlob], fileName, { type: 'image/jpeg' }));
    formData.append('uploadType', 'avatar');
    
    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    const uploadData = await response.json();
    
    // Update avatar in database
    await fetch('/api/auth/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatarUrl: uploadData.upload.url,
        fileId: uploadData.upload.fileId,
      }),
    });
    
    toast.success('Avatar updated successfully');
    setPreviewUrl(uploadData.upload.url);
    await refetchUser();
    
  } catch (error: any) {
    toast.error(error.message || 'Failed to upload avatar');
  } finally {
    setIsUploading(false);
  }
};
```

---

### Phase 3: Update Server APIs (Week 2)

#### 3.1 Remove Direct ImageKit Auth (Optional)

Since all uploads now go through `/api/photos/upload`, we can optionally disable direct ImageKit auth:

**File:** `/src/app/api/imagekit/auth/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // DEPRECATED: All uploads should now use /api/photos/upload
  // This endpoint is kept for backward compatibility but should not be used
  
  console.warn('[ImageKit Auth] DEPRECATED: Use /api/photos/upload instead');
  
  // Option 1: Disable completely
  return apiError(
    'Direct ImageKit uploads are no longer supported. Use /api/photos/upload instead.',
    410, // Gone
    'ENDPOINT_DEPRECATED'
  );
  
  // Option 2: Keep for gradual migration
  // ... existing code
}
```

---

#### 3.2 Update `/api/locations` to Validate Metadata

Even though metadata is now sanitized in `/api/photos/upload`, add validation as defense-in-depth:

**File:** `/src/app/api/locations/route.ts`

```typescript
// Add sanitization when saving photos
if (body.photos && Array.isArray(body.photos) && body.photos.length > 0) {
  await prisma.photo.createMany({
    data: body.photos.map((photo: any, index: number) => ({
      locationId: location.id,
      userId: user.id,
      imagekitFileId: photo.imagekitFileId || photo.fileId,
      imagekitFilePath: photo.imagekitFilePath || photo.filePath,
      originalFilename: photo.originalFilename || photo.name,
      fileSize: photo.fileSize || photo.size,
      mimeType: photo.mimeType || photo.type,
      width: photo.width,
      height: photo.height,
      isPrimary: index === 0,
      caption: photo.caption || null,
      
      // GPS/EXIF metadata - SANITIZE as defense-in-depth
      gpsLatitude: photo.gpsLatitude || null,
      gpsLongitude: photo.gpsLongitude || null,
      gpsAltitude: photo.gpsAltitude || null,
      hasGpsData: photo.hasGpsData || false,
      
      // SANITIZE text fields (already done in upload, but double-check)
      cameraMake: photo.cameraMake ? sanitizeText(photo.cameraMake) : null,
      cameraModel: photo.cameraModel ? sanitizeText(photo.cameraModel) : null,
      lensMake: photo.lensMake ? sanitizeText(photo.lensMake) : null,
      lensModel: photo.lensModel ? sanitizeText(photo.lensModel) : null,
      
      dateTaken: photo.dateTaken ? new Date(photo.dateTaken) : null,
      iso: photo.iso || null,
      focalLength: photo.focalLength ? sanitizeText(photo.focalLength) : null,
      aperture: photo.aperture ? sanitizeText(photo.aperture) : null,
      shutterSpeed: photo.shutterSpeed ? sanitizeText(photo.shutterSpeed) : null,
      exposureMode: photo.exposureMode ? sanitizeText(photo.exposureMode) : null,
      whiteBalance: photo.whiteBalance ? sanitizeText(photo.whiteBalance) : null,
      flash: photo.flash ? sanitizeText(photo.flash) : null,
      orientation: photo.orientation || null,
      colorSpace: photo.colorSpace ? sanitizeText(photo.colorSpace) : null,
      uploadSource: photo.uploadSource || 'manual',
    })),
  });
}
```

---

### Phase 4: Testing (Week 3)

#### 4.1 Security Testing Checklist

- [ ] **Virus Scan Test**
  - [ ] Upload clean image → Should succeed
  - [ ] Upload EICAR test file → Should be blocked
  - [ ] Check SecurityLog entry created

- [ ] **File Type Validation (JPEG/HEIC/TIFF)**
  - [ ] Upload `.jpg` → Should succeed
  - [ ] Upload `.jpeg` → Should succeed
  - [ ] Upload `.JPG` (uppercase) → Should succeed
  - [ ] Upload `.heic` (iPhone photo) → Should succeed & convert to JPEG
  - [ ] Upload `.HEIC` (uppercase) → Should succeed & convert to JPEG
  - [ ] Upload `.tif` → Should succeed & convert to JPEG
  - [ ] Upload `.tiff` → Should succeed & convert to JPEG
  - [ ] Upload `.png` → Should be rejected
  - [ ] Upload `.gif` → Should be rejected
  - [ ] Upload `.webp` → Should be rejected
  - [ ] Upload `.pdf` → Should be rejected
  - [ ] Upload `.exe` (renamed to `.jpg`) → Should be rejected
  - [ ] Verify HEIC files converted to JPEG in CDN
  - [ ] Verify TIFF files converted to JPEG in CDN

- [ ] **File Size Validation**
  - [ ] Upload 1MB photo → Should succeed
  - [ ] Upload 9MB photo → Should succeed
  - [ ] Upload 11MB photo → Should be rejected

- [ ] **Metadata Sanitization**
  - [ ] Photo with normal EXIF → Saved correctly
  - [ ] Photo with `<script>` in Make field → Script tags stripped
  - [ ] Photo with SQL-like strings → Safely escaped

- [ ] **All Upload Paths**
  - [ ] Avatar upload → Uses secure endpoint
  - [ ] Banner upload → Uses secure endpoint
  - [ ] Create-with-photo → Uses secure endpoint
  - [ ] Save location with photos → Uses secure endpoint
  - [ ] Edit location add photos → Uses secure endpoint

#### 4.2 Functional Testing

- [ ] Upload flows work end-to-end
- [ ] Photos display correctly
- [ ] GPS/EXIF data preserved
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly
- [ ] Rollback works if upload fails

#### 4.3 Performance Testing

- [ ] Upload time comparable to direct ImageKit
- [ ] Server can handle concurrent uploads
- [ ] Virus scanning doesn't timeout

#### 4.4 Image Processing Testing

**Format Conversion:**
- [ ] HEIC upload → Verify converted to JPEG
- [ ] TIFF upload → Verify converted to JPEG
- [ ] JPEG upload → No conversion (stays JPEG)
- [ ] Check MIME type saved correctly in database

**Compression Testing:**
- [ ] Large photo (8MB, 6000×4000px)
  - [ ] Compresses to ≤ 2MB
  - [ ] Dimensions preserved: 6000×4000px
  - [ ] Visual quality acceptable
  
- [ ] Medium photo (3MB, 4032×3024px)
  - [ ] Compresses to ≤ 2MB
  - [ ] Dimensions preserved: 4032×3024px
  
- [ ] Small photo (500KB, 1920×1080px)
  - [ ] No compression needed
  - [ ] Dimensions preserved: 1920×1080px

**Dimension Preservation:**
- [ ] Portrait photo (3024×4032px) → Dimensions preserved
- [ ] Landscape photo (4032×3024px) → Dimensions preserved
- [ ] Square photo (3000×3000px) → Dimensions preserved
- [ ] Panorama (8000×2000px) → Dimensions preserved

**Quality Checks:**
- [ ] 90% quality → Visual inspection (should be excellent)
- [ ] 80% quality → Visual inspection (should be good)
- [ ] 70% quality → Visual inspection (acceptable for web)
- [ ] 60% quality → Visual inspection (minimum acceptable)

**HEIC Specific:**
- [ ] iPhone 13 Pro photo (HEIC, 4032×3024px, ~4MB)
  - [ ] Uploads successfully
  - [ ] Converts to JPEG
  - [ ] Compresses to ~1.5-2MB
  - [ ] Dimensions: 4032×3024px preserved
  - [ ] EXIF data preserved (camera, GPS, date)
  
- [ ] iPhone portrait mode (HEIC with depth map)
  - [ ] Uploads successfully
  - [ ] Depth data handled gracefully

**TIFF Specific:**
- [ ] Scanner TIFF (300dpi, uncompressed, 15MB)
  - [ ] Uploads successfully
  - [ ] Converts to JPEG
  - [ ] Compresses to ~2MB
  - [ ] Dimensions preserved
  
- [ ] Camera RAW → TIFF (Adobe export)
  - [ ] Converts successfully
  - [ ] Color accuracy maintained

**Edge Cases:**
- [ ] Corrupted HEIC file → Graceful error message
- [ ] Corrupted TIFF file → Graceful error message
- [ ] HEIC without EXIF → Handles gracefully
- [ ] Extremely large dimensions (12000×8000px) → Handles or provides clear limit

---

## 📊 Migration Checklist

### Pre-Migration: Dependencies & Setup

#### Install Sharp (Image Processing)

```bash
# Install Sharp
npm install sharp

# Verify installation
npm ls sharp
```

**Sharp Version:** `^0.33.0` or later (includes HEIC/HEIF support)

**Platform-Specific Notes:**

**macOS:**
```bash
# No additional setup needed
# Homebrew dependencies are automatically handled
npm install sharp
```

**Linux (Production/Staging):**
```bash
# Install system dependencies for HEIC support
sudo apt-get update
sudo apt-get install -y libvips-dev libheif-dev

# Then install Sharp
npm install sharp
```

**Vercel Deployment:**
- Sharp is automatically optimized for Vercel's platform
- HEIC support is included by default
- No additional configuration needed
- Uses pre-built binaries for fast deployment

**Verify HEIC Support:**

Create a test script `test-sharp-heic.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

async function testHEIC() {
  try {
    // Test with a sample HEIC file
    const metadata = await sharp('test.heic').metadata();
    console.log('✅ HEIC support confirmed:', metadata.format);
    
    // Test conversion
    await sharp('test.heic').jpeg().toFile('test-converted.jpg');
    console.log('✅ HEIC → JPEG conversion successful');
  } catch (error) {
    console.error('❌ HEIC support issue:', error.message);
  }
}

testHEIC();
```

Run: `node test-sharp-heic.js`

#### Troubleshooting Sharp Installation

**Issue: HEIC not supported**
```bash
# Reinstall with verbose logging
npm install sharp --verbose

# Check for libheif in logs
# Look for: "prebuilt libvips ... libheif=true"
```

**Issue: Module not found in production**
```bash
# Ensure sharp is in dependencies, not devDependencies
npm install sharp --save

# Verify in package.json:
# "dependencies": { "sharp": "^0.33.0" }
```

**Issue: Memory errors with large images**
```javascript
// Add to server startup or endpoint
sharp.cache({ memory: 100 }); // Limit cache to 100MB
sharp.concurrency(2); // Limit concurrent operations
```

### Pre-Migration: Security Setup

- [ ] Review this document with team
- [ ] **Install Sharp:** Run `npm install sharp` and verify HEIC support
- [ ] **Set up ClamAV** on staging server
- [ ] Test virus scanning in staging
- [ ] Create backup of production database
- [ ] **Test image processing** with sample HEIC/TIFF files

### Week 1: Backend
- [ ] Create `/api/photos/upload` endpoint
- [ ] Add comprehensive logging
- [ ] Add security event logging
- [ ] Test endpoint with Postman
- [ ] Deploy to staging
- [ ] Run security tests

### Week 2: Frontend
- [ ] Update PhotoLocationForm component
- [ ] Update ImageKitUploader component
- [ ] Update avatar/banner (optional)
- [ ] Test all upload flows in staging
- [ ] Fix any UI/UX issues

### Week 3: Testing & Deployment
- [ ] Run full security test suite
- [ ] Run functional test suite
- [ ] Performance testing
- [ ] Code review
- [ ] Deploy to production
- [ ] Monitor uploads for 48 hours

### Post-Migration
- [ ] Verify all uploads going through secure endpoint
- [ ] Check SecurityLog for blocked uploads
- [ ] Monitor error rates
- [ ] Deprecate `/api/imagekit/auth` endpoint (optional)
- [ ] Update documentation

---

## 🎯 Success Criteria

### Security Goals
✅ **100% of photo uploads** go through virus scanning  
✅ **Zero direct CDN uploads** from client  
✅ **All metadata sanitized** before database insert  
✅ **Security logging** for all blocked uploads  

### Performance Goals
✅ Upload time **< 5 seconds** for 5MB photo  
✅ Virus scan time **< 2 seconds**  
✅ Server handles **10 concurrent uploads**  
✅ Image compression **< 3 seconds** for 10MB photo  

### Image Processing Goals
✅ **HEIC photos** upload successfully and convert to JPEG  
✅ **TIFF photos** upload successfully and convert to JPEG  
✅ **Dimensions preserved** for location photos (no unwanted resizing)  
✅ **Compression to 2MB max** while maintaining quality  
✅ **Format conversion** transparent to user  
✅ **EXIF/GPS data** preserved through conversion  

### User Experience Goals
✅ **No breaking changes** to UI/UX  
✅ **Clear error messages** for blocked files  
✅ **Progress indicators** during upload  
✅ **Graceful fallbacks** if scanning unavailable  
✅ **Format-specific feedback** (e.g., "HEIC will be converted")  
✅ **iPhone photos** work seamlessly (HEIC auto-conversion)  

---

## 📚 Related Documentation

- [Virus Scanning Setup](../features/virus-scanning.md)
- [Input Sanitization Guide](../guides/input-sanitization.md)
- [ImageKit Integration](../features/imagekit-cdn.md)
- [Security Best Practices](../guides/security-best-practices.md)
- [Create-with-Photo Review](./CREATE_WITH_PHOTO_UPLOAD_REVIEW.md)

---

## 🔗 References

### Security Standards
- OWASP File Upload Guidelines
- ClamAV Integration Best Practices
- XSS Prevention (EXIF metadata)

### Image Processing
- [Sharp Documentation](https://sharp.pixelplumbing.com/) - Image processing library
- [Sharp HEIC Support](https://sharp.pixelplumbing.com/install#libheif) - HEIC/HEIF format handling
- [JPEG Optimization](https://sharp.pixelplumbing.com/api-output#jpeg) - Compression settings
- HEIC Format Specification (Apple)
- TIFF Format Specification

### Existing Secure Implementations
- `/src/app/api/auth/avatar/route.ts` - Avatar upload pattern
- `/src/app/api/auth/banner/route.ts` - Banner upload pattern
- `/src/lib/virus-scan.ts` - Virus scanning library
- `/src/lib/sanitize.ts` - Input sanitization

### Dependencies
- `sharp` - ^0.33.0 - Image processing and format conversion
- `clamscan` - Virus scanning integration
- `exifr` - EXIF metadata extraction (already in use)

---

**Document Status:** Ready for Implementation  
**Priority:** 🔴 Critical Security Issue  
**Estimated Effort:** 3 weeks (1 developer)  
**Risk Level:** High (photo uploads currently insecure)  

---

## 📸 Quick Reference: Allowed Image Formats

| Format | Extensions | MIME Types | Conversion | Notes |
|--------|-----------|------------|------------|-------|
| **JPEG** | `.jpg`, `.jpeg` (case-insensitive) | `image/jpeg` | None (native web format) | Primary format, best browser support |
| **HEIC** | `.heic` (case-insensitive) | `image/heic`, `image/heif` | → JPEG | Apple's modern format, common on iPhones |
| **TIFF** | `.tif`, `.tiff` (case-insensitive) | `image/tiff` | → JPEG | Professional/scanner format, large files |

**Rejected Formats:** PNG, GIF, WebP, BMP, SVG, PDF, and all non-image files

**Why These Formats?**
- **JPEG:** Universal web standard, excellent compression, EXIF support
- **HEIC:** iPhone default (70% of mobile users), requires server conversion
- **TIFF:** Professional photography/scanning, high quality, requires conversion

**Processing Strategy:**
1. Upload any allowed format
2. Server validates format (MIME type + extension)
3. Convert HEIC/TIFF → JPEG (web compatibility)
4. Preserve original dimensions (GPS accuracy)
5. Compress to 2MB max (quality 90% → 60% adaptive)
6. Store JPEG on CDN, metadata in database

---

**Next Steps:**
1. Team review and approval
2. Install Sharp (`npm install sharp`) and verify HEIC support
3. Set up ClamAV on staging
4. Begin Phase 1 implementation
