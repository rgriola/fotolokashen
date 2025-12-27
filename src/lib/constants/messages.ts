/**
 * Error Messages
 * Centralized, consistent error messages for better UX
 */

export const ERROR_MESSAGES = {
    // Authentication errors
    AUTH: {
        NOT_AUTHENTICATED: 'Please log in to continue',
        SESSION_EXPIRED: 'Your session has expired. Please log in again.',
        UNAUTHORIZED: 'You do not have permission to perform this action',
    },

    // Photo upload errors
    UPLOAD: {
        FAILED: 'Failed to upload photo. Please try again.',
        AUTH_FAILED: 'Failed to authenticate for photo upload',
        SIZE_EXCEEDED: (maxMB: number) => `Photo size must be under ${maxMB}MB`,
        INVALID_FORMAT: 'Invalid file format. Please upload an image.',
        COMPRESSION_FAILED: 'Failed to compress image',
    },

    // GPS/EXIF errors
    GPS: {
        NO_DATA: 'Photo does not contain GPS data',
        EXTRACTION_FAILED: 'Failed to extract GPS data from photo',
        INVALID_COORDINATES: 'Invalid GPS coordinates',
    },

    // Validation errors
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_CHARS: 'Contains invalid characters',
        MAX_LENGTH: (max: number) => `Must be ${max} characters or less`,
        MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
    },

    // Location errors
    LOCATION: {
        SAVE_FAILED: 'Failed to save location. Please try again.',
        NOT_FOUND: 'Location not found',
        ALREADY_SAVED: 'This location is already in your saved locations',
    },

    // ImageKit errors
    IMAGEKIT: {
        AUTH_FAILED: 'Failed to get ImageKit authentication',
        UPLOAD_FAILED: 'Failed to upload to ImageKit',
    },

    // Generic errors
    GENERIC: {
        UNEXPECTED: 'An unexpected error occurred. Please try again.',
        NETWORK: 'Network error. Please check your connection.',
    },
} as const;

/**
 * Success messages for consistent UX
 */
export const SUCCESS_MESSAGES = {
    LOCATION: {
        CREATED: 'Location created successfully!',
        CREATED_FROM_PHOTO: 'Location created from photo!',
        UPDATED: 'Location updated successfully!',
        DELETED: 'Location deleted successfully!',
    },

    PHOTO: {
        UPLOADED: 'Photo uploaded successfully!',
        DELETED: 'Photo deleted successfully!',
    },

    AUTH: {
        LOGIN_SUCCESS: 'Welcome back!',
        LOGOUT_SUCCESS: 'Logged out successfully',
        PROFILE_UPDATED: 'Profile updated successfully!',
    },
} as const;
