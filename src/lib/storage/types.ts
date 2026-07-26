/**
 * Storage Adapter Types
 *
 * Vendor-neutral contract for photo/file storage. The rest of the app should
 * depend on these types (and the adapter exported from `./index`), never on a
 * specific vendor SDK directly. This keeps a future storage vendor migration
 * a mechanical adapter swap instead of an app-wide rewrite.
 */

/** Predefined photo size variants for consistent image optimization. */
export type PhotoVariant = 'thumbnail' | 'card' | 'gallery' | 'full' | 'og';

/**
 * Bundle of all standard photo size variants for a single stored file.
 * Returned alongside Photo records in API responses so clients (iOS, web)
 * can pick the right size without computing transform URLs themselves.
 */
export interface PhotoSizes {
    thumbnail: string;  // 200x200 — grid cells, avatars, marker thumbs
    card: string;       // 400x300 — list rows, location cards
    gallery: string;    // 1200x800 — detail view, lightbox
    full: string;       // 1600w   — high-res download / share
    og: string;         // 1200x630 — Open Graph / social share
}

/** Result of a successful (or failed) file upload to the storage backend. */
export interface StorageUploadResult {
    success: boolean;
    url?: string;
    fileId?: string;
    filePath?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    error?: string;
}

/** Result of a delete operation against the storage backend. */
export interface StorageDeleteResult {
    success: boolean;
    error?: string;
}

/** Signed upload credentials for direct client-to-storage uploads. */
export interface SignedUploadParams {
    uploadUrl: string;
    uploadToken: string;
    signature: string;
    expire: number;
    fileName: string;
    folder: string;
    publicKey: string;
}

/** Raw client-authentication parameters for direct browser-to-storage uploads. */
export interface StorageAuthParams {
    token: string;
    signature: string;
    expire: number;
    publicKey: string;
    urlEndpoint: string;
}

/**
 * Vendor-neutral storage adapter contract.
 * Any new storage provider (Cloudflare Images, Bunny, S3, etc.) implements
 * this interface so call sites never change when the vendor changes.
 */
export interface StorageAdapter {
    /** Upload a file buffer to the storage backend. Server-side only. */
    upload(params: {
        file: Buffer | string;
        fileName: string;
        folder?: string;
        tags?: string[];
    }): Promise<StorageUploadResult>;

    /** Delete a file from the storage backend by its file ID. Server-side only. */
    delete(fileId: string): Promise<StorageDeleteResult>;

    /** Delete an entire folder (and its contents) from the storage backend. Server-side only. */
    deleteFolder(folderPath: string): Promise<StorageDeleteResult>;

    /** Build a fully-qualified, optionally-transformed URL for a stored file path. */
    getUrl(filePath: string, transformations?: string): string;

    /** Generate raw client-authentication parameters for direct browser-to-storage uploads. Server-side only. */
    getAuthParams(): StorageAuthParams;

    /** Get a single optimized photo URL for a predefined size variant. */
    getPhotoUrl(filePath: string, variant?: PhotoVariant): string;

    /** Build all standard photo size variants for a stored file path. */
    getPhotoVariants(filePath: string | null | undefined): PhotoSizes | null;

    /** Generate signed upload credentials for a direct client-to-storage upload. Server-side only. */
    generateSignedUploadUrl(params: { folder: string; fileName: string }): Promise<SignedUploadParams>;
}
