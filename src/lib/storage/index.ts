/**
 * Storage — public entry point.
 *
 * All app code should import from `@/lib/storage`, never from a vendor-specific
 * adapter file directly. Today this re-exports the ImageKit adapter; a future
 * vendor migration only needs to change what this file points to.
 */

export type {
    PhotoVariant,
    PhotoSizes,
    StorageAdapter,
    StorageUploadResult,
    StorageDeleteResult,
    SignedUploadParams,
    StorageAuthParams,
} from './types';

export {
    IMAGEKIT_URL_ENDPOINT,
    getImageKitFolder,
    getImageKitUrl,
    getPhotoUrl,
    getPhotoVariants,
    attachPhotoSizes,
    getOptimizedAvatarUrl,
    uploadToImageKit,
    deleteFromImageKit,
    deleteImageKitFolder,
    generateSignedUploadUrl,
    getImageKitAuthParams,
    imagekitAdapter,
} from './imagekit-adapter';
