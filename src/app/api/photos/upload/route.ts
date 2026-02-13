import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { uploadToImageKit } from '@/lib/imagekit';
import { scanFile } from '@/lib/virus-scan';
import { sanitizeText } from '@/lib/sanitize';
import { FILE_SIZE_LIMITS, FOLDER_PATHS } from '@/lib/constants/upload';
import prisma from '@/lib/prisma';
import sharp from 'sharp';

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
        ? FILE_SIZE_LIMITS.BANNER
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
          eventType: 'PHOTO_UPLOAD_BLOCKED',
          metadata: { viruses: scanResult.viruses, uploadType, filename: file.name },
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
    let processedBuffer: Buffer = buffer;
    let finalMimeType = file.type;
    
    // Convert HEIC/TIFF to JPEG for web compatibility
    const needsConversion = file.type.includes('heic') || 
                           file.type.includes('heif') || 
                           file.type.includes('tiff');
    
    if (needsConversion) {
      console.log(`[Photo Upload] Converting ${file.type} to JPEG...`);
      try {
        // Convert to JPEG, preserve dimensions
        processedBuffer = await sharp(buffer)
          .jpeg({ quality: 90 }) // High quality for initial conversion
          .toBuffer();
        
        finalMimeType = 'image/jpeg';
        console.log(`[Photo Upload] ✅ Converted to JPEG (${(processedBuffer.length / 1024).toFixed(2)} KB)`);
      } catch (error) {
        console.error(`[Photo Upload] Conversion failed:`, error);
        return apiError('Failed to process image format', 500, 'CONVERSION_ERROR');
      }
    }
    
    // Compress if needed to meet size targets
    const targetSize = uploadType === 'location' ? 2 : uploadType === 'banner' ? 2 : 1; // MB
    const currentSizeMB = processedBuffer.length / (1024 * 1024);
    
    if (currentSizeMB > targetSize) {
      console.log(`[Photo Upload] Compressing ${file.name} from ${currentSizeMB.toFixed(2)}MB to ${targetSize}MB...`);
      try {
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
        // Continue with uncompressed if compression fails (already converted to JPEG)
      }
    }

    // 9. Determine upload folder based on type
    let uploadFolder: string;
    let fileName: string;
    
    switch (uploadType) {
      case 'avatar':
        uploadFolder = FOLDER_PATHS.userAvatars(user.id);
        fileName = `avatar-${user.id}-${Date.now()}.jpg`;
        break;
      case 'banner':
        uploadFolder = FOLDER_PATHS.userAvatars(user.id).replace('/avatars', '/banners');
        fileName = `banner-${user.id}-${Date.now()}.jpg`;
        break;
      case 'location':
      default:
        uploadFolder = FOLDER_PATHS.userPhotos(user.id);
        fileName = `photo-${Date.now()}-${file.name.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '')}.jpg`;
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
        size: processedBuffer.length, // Return processed size
        mimeType: finalMimeType, // Return final MIME type (always JPEG after processing)
      },
      metadata: sanitizedMetadata,
    };

    return apiResponse(response, 201);

  } catch (error) {
    console.error('[Photo Upload] Unexpected error:', error);
    return apiError(
      error instanceof Error ? error.message : 'Upload failed',
      500,
      'UPLOAD_ERROR'
    );
  }
}
