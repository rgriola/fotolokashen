/**
 * ImageKit Configuration
 * Centralized configuration for ImageKit CDN
 */

// ImageKit URL Endpoint - must match IMAGEKIT_URL_ENDPOINT in .env.local
export const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/rgriola';

/**
 * Constructs full ImageKit URL from file path
 * @param filePath - ImageKit file path (e.g., /locations/abc/photo.jpg)
 * @returns Full ImageKit URL
 */
export function getImageKitUrl(filePath: string): string {
    // Remove leading slash if present (ImageKit paths start with /)
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${IMAGEKIT_URL_ENDPOINT}${cleanPath}`;
}
