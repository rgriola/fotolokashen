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
 * ImageKit folder path generators
 * User-first folder structure for organized storage
 */
export const FOLDER_PATHS = {
    userLocation: (userId: number, placeId: string) =>
        `/users/${userId}/locations/${placeId}`,
    userAvatars: (userId: number) =>
        `/users/${userId}/avatars`,
    userUploads: (userId: number) =>
        `/users/${userId}/uploads`,
} as const;

/**
 * File size limits (in MB)
 */
export const FILE_SIZE_LIMITS = {
    PHOTO: 1.5,
    AVATAR: 5,
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
