/**
 * Upload Constants
 * Centralized constants for photo uploads and storage paths
 */

/**
 * Upload source identifiers
 * Used to track where photos were uploaded from
 */
export const UPLOAD_SOURCES = {
    PHOTO_GPS: 'photo_gps',
    MANUAL: 'manual',
    BULK_UPLOAD: 'bulk_upload',
} as const;

export type UploadSource = typeof UPLOAD_SOURCES[keyof typeof UPLOAD_SOURCES];

/**
 * Get current environment for ImageKit folder paths
 * Returns 'development' or 'production'
 */
export function getEnvironment(): 'development' | 'production' {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

/**
 * ImageKit folder path generators
 * SCALABLE STRUCTURE: Flat user directories with environment separation
 * 
 * Structure: /{environment}/users/{userId}/photos/
 * - Fast retrieval (no deep nesting)
 * - Environment isolated (dev/prod separate)
 * - Database manages relationships (location, tags, etc.)
 * - Easy to migrate/reorganize
 */
export const FOLDER_PATHS = {
    // Photos: Flat directory per user (database handles location relationships)
    userPhotos: (userId: number) =>
        `/${getEnvironment()}/users/${userId}/photos`,
    
    // Avatars: Separate from photos for easier management
    userAvatars: (userId: number) =>
        `/${getEnvironment()}/users/${userId}/avatars`,
    
    // General uploads: Catch-all for other files
    userUploads: (userId: number) =>
        `/${getEnvironment()}/users/${userId}/uploads`,
} as const;

/**
 * Get user's root folder path for bulk operations (like deletion)
 * This gets the user's entire folder to delete all their files
 */
export function getUserRootFolder(userId: number): string {
    return `/${getEnvironment()}/users/${userId}/`;
}

/**
 * File size limits (in MB)
 */
export const FILE_SIZE_LIMITS = {
    PHOTO: 10, // Increased from 1.5 MB to 10 MB for modern photos
    AVATAR: 5,
} as const;

/**
 * Allowed image formats for uploads
 * Supports JPEG, HEIC (Apple), and TIFF formats
 */
export const ALLOWED_IMAGE_FORMATS = {
    MIME_TYPES: [
        'image/jpeg',      // .jpg, .jpeg
        'image/heic',      // .heic (Apple HEIF)
        'image/heif',      // .heif (HEIC variant)
        'image/tiff',      // .tif, .tiff
    ],
    EXTENSIONS: [
        '.jpg', '.jpeg', '.JPG', '.JPEG',
        '.heic', '.HEIC',
        '.tif', '.tiff', '.TIF', '.TIFF',
    ],
} as const;

/**
 * Image compression targets (in MB)
 * After virus scan and format conversion, images are compressed to these targets
 */
export const IMAGE_COMPRESSION_TARGETS = {
    LOCATION_PHOTO: 2,  // 2MB for location photos (preserve quality for GPS accuracy)
    AVATAR: 1,          // 1MB for avatars
    BANNER: 2,          // 2MB for banner images
} as const;

/**
 * Image quality settings for compression
 * Adaptive quality used to meet size targets while preserving dimensions
 */
export const IMAGE_QUALITY = {
    HIGH: 90,    // Initial quality for HEIC/TIFF conversion
    GOOD: 80,    // Good quality for most photos
    MEDIUM: 70,  // Medium quality if still too large
    LOW: 60,     // Minimum acceptable quality
} as const;

/**
 * Photo upload limits
 */
export const PHOTO_LIMITS = {
    MAX_PHOTOS_PER_LOCATION: 20,
    MAX_TAGS_PER_PHOTO: 20,
    MAX_TAG_LENGTH: 25,
} as const;

/**
 * Character limits for text fields
 */
export const TEXT_LIMITS = {
    LOCATION_NAME: 200,
    ADDRESS: 500,
    CAPTION: 200,
    PRODUCTION_NOTES: 500,
    ENTRY_POINT: 200,
    PARKING: 200,
    ACCESS: 200,
    PLACE_ID: 255,
    COLOR: 20,
} as const;
