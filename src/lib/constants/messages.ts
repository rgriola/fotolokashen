/**
 * Standardized toast durations (milliseconds)
 * success/info: 3s, error/warning: 5s, loading: persistent (Infinity)
 */
export const TOAST_DURATION = {
    SUCCESS: 3000,
    ERROR: 5000,
    INFO: 3000,
    WARNING: 5000,
} as const;

/**
 * Centralized toast & UI messages — organized by domain.
 *
 * Usage:
 *   import { TOAST } from '@/lib/constants/messages';
 *   toast.success(TOAST.AUTH.LOGIN_SUCCESS);
 *   toast.error(TOAST.PHOTO.NOT_IMAGE, { duration: TOAST_DURATION.ERROR });
 */
export const TOAST = {
    // ── Authentication ────────────────────────────────────────────────
    AUTH: {
        LOGIN_SUCCESS: 'Welcome back!',
        LOGIN_FAILED: 'Login failed. Please check your credentials.',
        LOGOUT_SUCCESS: 'Logged out successfully',
        LOGOUT_FAILED: 'Failed to logout',
        REGISTER_SUCCESS: 'Account created! Please check your email to verify your account.',
        REGISTER_FAILED: 'Registration failed. Please try again.',
        VERIFICATION_SENT: 'Verification email sent! Check your inbox.',
        VERIFICATION_RESENT: 'Verification email resent! Check your inbox.',
        VERIFICATION_FAILED: 'Failed to resend verification email',
        VERIFICATION_RATE_LIMITED: 'Verification email was sent recently. Please check your inbox.',
        VERIFICATION_REQUIRED: 'Email verification required',
        VERIFY_BEFORE_LOGIN: 'Please verify your email before logging in.',
        RESET_EMAIL_SENT: 'If an account exists with that email, a reset link has been sent.',
        RESET_SUCCESS: 'Password reset successful!',
        RESET_SUCCESS_LOGIN: 'Password reset successful! Logging you in...',
        RESET_FAILED: 'Failed to reset password',
        RESET_LINK_INVALID: 'Invalid or expired reset link. Please request a new one.',
        NOT_AUTHENTICATED: 'Please log in to continue',
        LOGIN_REQUIRED: 'Please login to access this page',
        SESSION_EXPIRED: 'Your session has expired. Please log in again.',
        UNAUTHORIZED: 'You do not have permission to perform this action',
        ADMIN_ACCESS_DENIED: 'Admin access required',
        OAUTH_FAILED: 'OAuth authorization failed',
        OAUTH_FLOW_FAILED: 'Failed to complete OAuth flow',
        RESET_REQUEST_FAILED: 'Failed to send reset email',
        RESET_EMAIL_CHECK: 'Check your email for reset instructions',
    },

    // ── Locations ─────────────────────────────────────────────────────
    LOCATION: {
        CREATED: 'Location saved successfully!',
        CREATED_FROM_PHOTO: 'Location created from photo!',
        UPDATED: 'Location updated successfully!',
        DELETED: 'Location deleted',
        SAVE_FAILED: 'Failed to save location',
        UPDATE_FAILED: 'Failed to update location',
        DELETE_FAILED: 'Failed to delete location',
        ALREADY_SAVED: 'This location is already in your saved locations',
        NOT_FOUND: 'Location not found',
        NONE_AVAILABLE: 'No locations available',
        NONE_SAVED: 'No saved locations to display',
        SELECT_ON_MAP: 'Please select a location on the map',
        CAPTION_FAILED: 'Failed to update caption',
    },

    // ── Photos & Uploads ──────────────────────────────────────────────
    PHOTO: {
        UPLOADED: 'Photo uploaded successfully!',
        DELETED: 'Photo deleted successfully!',
        UPLOAD_FAILED: 'Failed to upload photos',
        UPLOAD_REQUIRED: 'Please upload a photo',
        NOT_IMAGE: 'File must be an image',
        SELECT_IMAGE: 'Please select an image file',
        SIZE_EXCEEDED: (maxMB: number) => `File size must be less than ${maxMB}MB`,
        CONVERTING: (fileName: string) => `Converting ${fileName} to JPEG...`,
        CONVERSION_FAILED: 'Failed to convert image format',
        PROCESS_FAILED: 'Failed to process image',
        NO_IMAGE_TO_SAVE: 'No image to save',
        SAVE_FAILED: 'Failed to save image',
        UPLOAD_AUTH_FAILED: 'Failed to authenticate for photo upload',
        MAX_PHOTOS: (max: number) => `Maximum ${max} photos allowed`,
        UPLOADING: (count: number) => `Uploading ${count} photo(s)...`,
        UPLOAD_SUCCESS: (count: number) => `${count} photo(s) uploaded successfully!`,
    },

    // ── Avatar ────────────────────────────────────────────────────────
    AVATAR: {
        UPLOADING: 'Uploading avatar...',
        UPDATED: 'Avatar updated successfully',
        UPLOAD_FAILED: 'Failed to upload avatar',
        EDIT_UPLOAD_FAILED: 'Failed to upload edited image',
    },

    // ── Banner ────────────────────────────────────────────────────────
    BANNER: {
        UPLOADING: 'Uploading banner...',
        UPDATED: 'Banner updated successfully',
        UPLOAD_FAILED: 'Failed to upload banner',
        EDIT_UPLOAD_FAILED: 'Failed to upload edited banner',
    },

    // ── Profile & Settings ────────────────────────────────────────────
    PROFILE: {
        UPDATED: 'Profile updated successfully!',
        UPDATE_FAILED: 'Failed to update profile',
        PASSWORD_CHANGED: 'Password changed successfully! Logging you out...',
        PASSWORD_FAILED: 'Failed to change password',
        EMAIL_VERIFICATION_SENT: 'Verification Email Sent',
        EMAIL_ALREADY_REGISTERED: 'Email Already Registered',
        EMAIL_SAME: 'Same Email',
        EMAIL_FAILED: 'Failed to change email',
        USERNAME_CHANGED: 'Username Changed!',
        USERNAME_TAKEN: 'Username Taken',
        USERNAME_RESERVED: 'Username Reserved',
        USERNAME_SAME: 'Same Username',
        USERNAME_FAILED: 'Failed to change username',
        TOO_MANY_REQUESTS: 'Too Many Requests',
        ANNUAL_LIMIT: 'Annual Limit Reached',
        INCORRECT_PASSWORD: 'Incorrect Password',
        PREFERENCES_SAVED: 'Preferences saved successfully',
        PREFERENCES_FAILED: 'Failed to update preferences',
        CHANGES_DISCARDED: 'Changes discarded',
        PRIVACY_UPDATED: 'Privacy settings updated',
        PRIVACY_LOAD_FAILED: 'Failed to load privacy settings',
        PRIVACY_SAVE_FAILED: 'Failed to save settings',
        HOME_LOCATION_UPDATED: 'Home location updated successfully',
        HOME_LOCATION_FAILED: 'Failed to update home location',
        ACCOUNT_DELETED: 'Your account has been deleted',
        ACCOUNT_DELETE_FAILED: 'Failed to delete account',
        DELETE_CONFIRM_REQUIRED: 'Please type DELETE to confirm',
        TOUR_RESTART_FAILED: 'Failed to restart tour',
        SECURITY_LOAD_FAILED: 'Failed to load security activity',
    },

    // ── Social / Follow ───────────────────────────────────────────────
    SOCIAL: {
        LOGIN_REQUIRED: 'Please log in to follow users',
        FOLLOW_FAILED: 'Something went wrong',
        FOLLOWED: (username: string) => `Following @${username}`,
        UNFOLLOWED: (username: string) => `Unfollowed @${username}`,
    },

    // ── Sharing & Visibility ──────────────────────────────────────────
    SHARING: {
        LINK_COPIED: 'Link copied to clipboard!',
        COPY_FAILED: 'Failed to copy link',
        VISIBILITY_UPDATED: (visibility: string) =>
            `Location visibility updated to ${visibility}`,
        VISIBILITY_FAILED: 'Failed to update visibility',
    },

    // ── GPS & Geolocation ─────────────────────────────────────────────
    GPS: {
        DISABLED: 'GPS is disabled',
        NOT_SUPPORTED: 'Geolocation is not supported by your browser',
        FOUND: 'Location found!',
        PERMISSION_DENIED: 'GPS permission denied by browser',
        UNAVAILABLE: 'Location unavailable',
        TIMEOUT: 'Location request timed out',
        GENERIC_ERROR: 'Unable to get location',
    },

    // ── Geocoding / Places ────────────────────────────────────────────
    GEOCODING: {
        PROCESSING: 'Processing coordinates...',
        FOUND: 'Coordinates found!',
        NOT_FOUND: 'Could not find location for these coordinates',
        FAILED: 'Failed to geocode coordinates',
    },

    // ── Tag Validation ────────────────────────────────────────────────
    TAGS: {
        DUPLICATE: 'This tag already exists',
        MAX_REACHED: 'Maximum 20 tags allowed',
        TOO_LONG: 'Tag must be 25 characters or less',
        INVALID_CHARS:
            'Invalid characters in tag. Only letters, numbers, spaces, and hyphens are allowed. @ symbol is not allowed.',
    },

    // ── Admin ─────────────────────────────────────────────────────────
    ADMIN: {
        USERS_LOAD_FAILED: 'Failed to load users',
        USER_DELETED: (email: string) => `User ${email} deleted successfully`,
        USER_DELETE_FAILED: 'Failed to delete user',
        TEMPLATES_LOAD_FAILED: 'Failed to load email templates',
        TEMPLATE_LOAD_FAILED: 'Failed to load template',
        TEMPLATE_DEFAULT_DELETE: 'Default templates cannot be deleted',
        TEMPLATE_DELETED: 'Template deleted successfully',
        TEMPLATE_DELETE_FAILED: 'Failed to delete template',
        TEMPLATE_SEEDED: 'Templates seeded successfully',
        TEMPLATE_SEED_FAILED: 'Failed to seed templates',
        TEMPLATE_SAVED: (isNew: boolean) =>
            isNew ? 'Template created successfully' : 'Template updated successfully',
        TEMPLATE_SAVE_FAILED: 'Failed to save template',
        TEMPLATE_SAVE_FIRST: 'Please save the template first',
        TEST_EMAIL_SENT: 'Test email sent to your account',
        TEST_EMAIL_FAILED: 'Failed to send test email',
        HTML_COPIED: 'HTML copied to clipboard',
        HEADER_IMAGE_UPLOADED: 'Header image uploaded successfully',
        HEADER_IMAGE_UPLOAD_FAILED: 'Failed to upload image',
        HEADER_IMAGE_REMOVED: 'Header image removed',
        TEMPLATE_SOURCE_FAILED: 'Failed to load source template',
        TEMPLATE_DUPLICATED: 'Template duplicated successfully',
        VERSIONS_LOAD_FAILED: 'Failed to load version history',
        VERSION_REVERTED: (version: number) =>
            `Reverted to version ${version} successfully`,
        VERSION_REVERT_FAILED: 'Failed to revert version',
        FIELD_REQUIRED: (field: string) => `${field} is required`,
        FIELDS_MISSING: (fields: string[]) =>
            `Missing required fields: ${fields.join(', ')}`,
        FIELD_VALIDATION: (field: string, error: string) =>
            `${field}: ${error}`,
    },

    // ── Preview Mode ──────────────────────────────────────────────────
    PREVIEW: {
        DELETE_DISABLED: (id: number) =>
            `Delete disabled in preview mode (location ID: ${id})`,
        CHANGES_SAVED: 'Changes saved (preview mode)',
        LOCATIONS_LOAD_FAILED: 'Failed to load locations',
        NONE_AVAILABLE: 'No locations available',
    },

    // ── Generic / Fallback ────────────────────────────────────────────
    GENERIC: {
        UNEXPECTED: 'An unexpected error occurred',
        NETWORK: 'Network error. Please check your connection.',
        CLIPBOARD_COPIED: 'Copied to clipboard',
    },

    // ── Upload Stages (for future toast.promise / staged feedback) ───
    UPLOAD_STAGE: {
        COMPRESSING: 'Compressing image...',
        UPLOADING: 'Uploading...',
        PROCESSING: 'Processing...',
        DONE: 'Upload complete!',
    },
} as const;

// ── Legacy aliases (used by 2 files — migrate then remove) ────────────
/** @deprecated Use TOAST.* instead */
export const ERROR_MESSAGES = {
    AUTH: TOAST.AUTH,
    UPLOAD: {
        FAILED: 'Failed to upload photo. Please try again.',
        AUTH_FAILED: 'Failed to authenticate for photo upload',
        SIZE_EXCEEDED: (maxMB: number) => `Photo size must be under ${maxMB}MB`,
        INVALID_FORMAT: 'Invalid file format. Please upload an image.',
        COMPRESSION_FAILED: 'Failed to compress image',
    },
    GPS: {
        NO_DATA: 'Photo does not contain GPS data',
        EXTRACTION_FAILED: 'Failed to extract GPS data from photo',
        INVALID_COORDINATES: 'Invalid GPS coordinates',
    },
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_CHARS: 'Contains invalid characters',
        MAX_LENGTH: (max: number) => `Must be ${max} characters or less`,
        MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
    },
    LOCATION: TOAST.LOCATION,
    IMAGEKIT: {
        AUTH_FAILED: 'Failed to get ImageKit authentication',
        UPLOAD_FAILED: 'Failed to upload to ImageKit',
    },
    GENERIC: TOAST.GENERIC,
} as const;

/** @deprecated Use TOAST.* instead */
export const SUCCESS_MESSAGES = {
    LOCATION: TOAST.LOCATION,
    PHOTO: TOAST.PHOTO,
    AUTH: {
        LOGIN_SUCCESS: TOAST.AUTH.LOGIN_SUCCESS,
        LOGOUT_SUCCESS: TOAST.AUTH.LOGOUT_SUCCESS,
        PROFILE_UPDATED: TOAST.PROFILE.UPDATED,
    },
} as const;
