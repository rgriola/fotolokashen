/**
 * Photo Cache Types
 * 
 * Types for managing photos in browser cache before uploading to ImageKit
 */

export interface CachedPhoto {
    // Unique identifier for this cached photo
    id: string;
    
    // File information
    file: File;
    preview: string; // Object URL or Base64 for preview
    
    // Metadata
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    
    // UI state
    isPrimary: boolean;
    caption?: string;
    
    // Upload tracking
    uploading: boolean;
    uploadProgress: number; // 0-100
    error?: string;
    
    // ImageKit response (populated after upload)
    imagekitFileId?: string;
    imagekitFilePath?: string;
    url?: string;
}

export interface UploadedPhotoData {
    imagekitFileId: string;
    imagekitFilePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    url: string;
    isPrimary: boolean;
    caption?: string;
}

export interface PhotoCacheManagerResult {
    cachedPhotos: CachedPhoto[];
    addPhoto: (file: File) => Promise<void>;
    removePhoto: (id: string) => void;
    updateCaption: (id: string, caption: string) => void;
    setPrimary: (id: string) => void;
    uploadAllToImageKit: (placeId?: string) => Promise<UploadedPhotoData[]>;
    clearCache: () => void;
    isUploading: boolean;
    hasPhotos: boolean;
}
