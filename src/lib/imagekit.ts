/**
 * ImageKit Configuration
 * Centralized configuration for ImageKit CDN
 */

// ImageKit URL Endpoint - reads from environment variable
// Fallback to rgriola endpoint for backward compatibility
export const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;
// ||
// process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
//  'https://ik.imagekit.io/rgriola';

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
 * @returns Full ImageKit URL
 */
export function getImageKitUrl(filePath: string): string {
    // Remove leading slash if present (ImageKit paths start with /)
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${IMAGEKIT_URL_ENDPOINT}${cleanPath}`;
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

        // Calculate expiry (5 minutes from now)
        const expire = Math.floor(Date.now() / 1000) + 300;

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
