/**
 * ImageKit Configuration
 * Centralized configuration for ImageKit CDN
 */

// ImageKit URL Endpoint - reads from environment variable
// Server-side: IMAGEKIT_URL_ENDPOINT (server-only operations)
// Client-side: Falls back to hardcoded value (since CDN URL is not sensitive)
export const IMAGEKIT_URL_ENDPOINT = 
    process.env.IMAGEKIT_URL_ENDPOINT ||              // Server-side (from Vercel)
    'https://ik.imagekit.io/rgriola';                 // Client-side fallback (safe to hardcode)

// Validate at module load
if (!IMAGEKIT_URL_ENDPOINT) {
    console.error('❌ CRITICAL: ImageKit URL endpoint not configured!');
    console.error('This should never happen - hardcoded fallback should work');
}

// Environment-based folder prefix
const ENV_FOLDER = process.env.NODE_ENV === 'production' ? '/production' : '/development';

/**
 * Get ImageKit folder path with environment prefix
 * @param path - Path relative to environment (e.g., 'users/123/avatars')
 * @returns Full folder path with environment prefix
 */
export function getImageKitFolder(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${ENV_FOLDER}/${cleanPath}`;
}

/**
 * Constructs full ImageKit URL from file path
 * This is CLIENT-SAFE - no SDK initialization required
 * @param filePath - ImageKit file path (e.g., /development/locations/abc/photo.jpg)
 * @param transformations - Optional ImageKit transformations (e.g., 'w-400,h-300,c-at_max')
 * @returns Full ImageKit URL with optional transformations
 */
export function getImageKitUrl(filePath: string, transformations?: string): string {
    if (!IMAGEKIT_URL_ENDPOINT) {
        console.warn('ImageKit URL endpoint not configured, photo URLs will be broken');
        return '';
    }
    
    // Remove leading slash if present (ImageKit paths start with /)
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const baseUrl = `${IMAGEKIT_URL_ENDPOINT}${cleanPath}`;
    
    // Add transformations if provided
    if (transformations) {
        return `${baseUrl}?tr=${transformations}`;
    }
    
    return baseUrl;
}

/**
 * Optimize avatar URL with ImageKit transformations
 * This is CLIENT-SAFE - just URL manipulation
 * @param url - Full ImageKit URL
 * @param size - Desired size in pixels (32, 64, 128, or 256)
 * @returns Optimized ImageKit URL with transformations
 */
export function getOptimizedAvatarUrl(
    url: string | null | undefined,
    size: 32 | 64 | 128 | 256 = 128
): string | null {
    if (!url) return null;

    // ImageKit transformation parameters:
    // w-X,h-X = width and height
    // c-at_max = maintain aspect ratio, fit within bounds
    // fo-auto = auto format (WebP for modern browsers, fallback for others)
    // q-80 = 80% quality (excellent balance of quality vs size)
    return `${url}?tr=w-${size},h-${size},c-at_max,fo-auto,q-80`;
}

/**
 * Get ImageKit instance for SERVER-SIDE operations only
 * This lazy-loads the SDK to avoid client-side issues
 */
function getImageKitInstance() {
    // Dynamic import to ensure this only runs on server
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImageKit = require('imagekit');

    return new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
        urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });
}

/**
 * Upload file to ImageKit
 * SERVER-SIDE ONLY
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
 * Delete file from ImageKit
 * SERVER-SIDE ONLY
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
 * Generate signed upload parameters for ImageKit
 * SERVER-SIDE ONLY
 * 
 * Returns authentication parameters that allow a mobile client to upload
 * directly to ImageKit with a time-limited signature (5 minutes)
 */
export async function generateSignedUploadUrl({
    folder,
    fileName,
}: {
    folder: string;
    fileName: string;
}): Promise<{
    uploadUrl: string;
    uploadToken: string;
    signature: string;
    expire: number;
    fileName: string;
    folder: string;
    publicKey: string;
}> {
    try {
        const imagekit = getImageKitInstance();

        // Generate authentication parameters from ImageKit SDK
        const authParams = imagekit.getAuthenticationParameters();

        return {
            uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload',
            uploadToken: authParams.token,
            signature: authParams.signature,
            expire: authParams.expire,
            fileName,
            folder: getImageKitFolder(folder),
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '',
        };
    } catch (error: unknown) {
        console.error('ImageKit signed URL generation error:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to generate upload URL');
    }
}
