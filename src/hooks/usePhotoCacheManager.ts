/**
 * Photo Cache Manager Hook
 * 
 * Manages photos in browser cache before uploading to ImageKit
 * Prevents orphaned photos by only uploading when user saves location
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import type { CachedPhoto, UploadedPhotoData, PhotoCacheManagerResult } from '@/types/photo-cache';
import { FILE_SIZE_LIMITS, PHOTO_LIMITS } from '@/lib/constants/upload';

interface UsePhotoCacheManagerOptions {
    maxPhotos?: number;
    maxFileSize?: number; // in MB
}

export function usePhotoCacheManager(options: UsePhotoCacheManagerOptions = {}): PhotoCacheManagerResult {
    const { user } = useAuth();
    const {
        maxPhotos = PHOTO_LIMITS.MAX_PHOTOS_PER_LOCATION,
        maxFileSize = FILE_SIZE_LIMITS.PHOTO,
    } = options;

    const [cachedPhotos, setCachedPhotos] = useState<CachedPhoto[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const objectUrlsRef = useRef<Set<string>>(new Set());
    
    // Debug: Log every time cachedPhotos changes
    useEffect(() => {
        console.log('[PhotoCacheManager Hook] cachedPhotos state changed:', cachedPhotos.length, cachedPhotos);
    }, [cachedPhotos]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        const objectUrls = objectUrlsRef.current;
        return () => {
            objectUrls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            objectUrls.clear();
        };
    }, []);

    /**
     * Validate photo file before adding to cache
     */
    const validatePhoto = useCallback((file: File): string | null => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            return 'File must be an image';
        }

        // Check file size
        const maxBytes = maxFileSize * 1024 * 1024;
        if (file.size > maxBytes) {
            return `File size must be less than ${maxFileSize}MB`;
        }

        // Check if we've reached max photos
        if (cachedPhotos.length >= maxPhotos) {
            return `Maximum ${maxPhotos} photos allowed`;
        }

        return null;
    }, [cachedPhotos.length, maxFileSize, maxPhotos]);

    /**
     * Load image and get dimensions
     * For browser-incompatible formats (HEIC, TIFF), returns placeholder dimensions
     */
    const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({ width: img.width, height: img.height });
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                
                // For formats browser can't preview (HEIC, TIFF, etc.), use placeholder dimensions
                // Actual dimensions will be determined server-side during upload/conversion
                console.log('[PhotoCache] Browser cannot preview this format, using placeholder dimensions');
                resolve({ width: 1920, height: 1080 }); // Placeholder - server will provide real dimensions
            };

            img.src = objectUrl;
        });
    }, []);

    /**
     * Add photo to cache
     */
    const addPhoto = useCallback(async (file: File): Promise<void> => {
        console.log('[PhotoCache] addPhoto called with file:', file.name);
        console.log('[PhotoCache] File size:', file.size, 'bytes (', (file.size / 1024 / 1024).toFixed(2), 'MB)');
        console.log('[PhotoCache] File type:', file.type);
        console.log('[PhotoCache] Max file size:', maxFileSize, 'MB');
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            console.log('[PhotoCache] REJECTED: Not an image');
            toast.error('File must be an image');
            return;
        }

        // Validate file size
        const maxBytes = maxFileSize * 1024 * 1024;
        console.log('[PhotoCache] Max bytes:', maxBytes);
        if (file.size > maxBytes) {
            console.log('[PhotoCache] REJECTED: File too large');
            toast.error(`File size must be less than ${maxFileSize}MB`);
            return;
        }
        
        console.log('[PhotoCache] Validation passed, proceeding with upload...');

        try {
            // Get dimensions
            const { width, height } = await getImageDimensions(file);
            console.log('[PhotoCache] Got dimensions:', width, 'x', height);

            // Create preview URL
            const preview = URL.createObjectURL(file);
            objectUrlsRef.current.add(preview);
            console.log('[PhotoCache] Created preview URL:', preview);

            // Create cached photo
            const cachedPhoto: CachedPhoto = {
                id: `cached-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                preview,
                originalFilename: file.name,
                fileSize: file.size,
                mimeType: file.type,
                width,
                height,
                isPrimary: false, // Will be set in the updater function
                uploading: false,
                uploadProgress: 0,
            };
            
            console.log('[PhotoCache] About to call setCachedPhotos...');

            // Use functional update to avoid stale closure issues
            setCachedPhotos((prev) => {
                console.log('[PhotoCache] setCachedPhotos updater - prev.length:', prev.length);
                const updated = [...prev, { ...cachedPhoto, isPrimary: prev.length === 0 }];
                console.log('[PhotoCache] setCachedPhotos updater - new length:', updated.length);
                return updated;
            });
            
            console.log('[PhotoCache] setCachedPhotos called, photo added:', cachedPhoto.id);
        } catch (error) {
            console.error('[PhotoCache] Failed to add photo:', error);
            toast.error('Failed to process image');
        }
    }, [maxFileSize, getImageDimensions]);

    /**
     * Remove photo from cache
     */
    const removePhoto = useCallback((id: string): void => {
        setCachedPhotos((prev) => {
            const photoToRemove = prev.find((p) => p.id === id);
            if (photoToRemove) {
                // Revoke object URL
                URL.revokeObjectURL(photoToRemove.preview);
                objectUrlsRef.current.delete(photoToRemove.preview);
                console.log('[PhotoCache] Removed photo from cache:', id);
            }

            const remaining = prev.filter((p) => p.id !== id);

            // If we removed the primary photo, make the first remaining photo primary
            if (photoToRemove?.isPrimary && remaining.length > 0) {
                remaining[0].isPrimary = true;
            }

            return remaining;
        });
    }, []);

    /**
     * Update photo caption
     */
    const updateCaption = useCallback((id: string, caption: string): void => {
        setCachedPhotos((prev) =>
            prev.map((photo) =>
                photo.id === id ? { ...photo, caption } : photo
            )
        );
    }, []);

    /**
     * Set photo as primary
     */
    const setPrimary = useCallback((id: string): void => {
        setCachedPhotos((prev) =>
            prev.map((photo) => ({
                ...photo,
                isPrimary: photo.id === id,
            }))
        );
    }, []);

    /**
     * Upload single photo via secure server endpoint
     * Server handles: virus scan, format conversion, compression, CDN upload
     */
    const uploadPhotoSecurely = useCallback(async (
        cachedPhoto: CachedPhoto
    ): Promise<UploadedPhotoData> => {
        const { file, originalFilename } = cachedPhoto;

        // Prepare form data for secure upload endpoint
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('uploadType', 'location'); // All cached photos are for locations

        console.log('[PhotoCache] Uploading via secure endpoint...');

        // Upload via secure endpoint (includes virus scan, format validation, compression)
        const response = await fetch('/api/photos/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[PhotoCache] Secure upload failed:', errorData);
            throw new Error(errorData.error || 'Failed to upload photo');
        }

        const result = await response.json();
        const uploadData = result.data;

        console.log('[PhotoCache] Upload successful:', uploadData.upload.filePath);

        return {
            imagekitFileId: uploadData.upload.fileId,
            imagekitFilePath: uploadData.upload.filePath,
            originalFilename,
            fileSize: uploadData.file.size,
            mimeType: uploadData.file.mimeType,
            width: uploadData.upload.width,
            height: uploadData.upload.height,
            url: uploadData.upload.url,
            isPrimary: cachedPhoto.isPrimary,
            caption: cachedPhoto.caption,
        };
    }, []);

    /**
     * Upload all cached photos to ImageKit
     */
    const uploadAllToImageKit = useCallback(async (): Promise<UploadedPhotoData[]> => {
        if (cachedPhotos.length === 0) {
            return [];
        }

        setIsUploading(true);
        const uploadedPhotos: UploadedPhotoData[] = [];

        try {
            console.log('[PhotoCache] Starting upload of', cachedPhotos.length, 'photos...');

            // Upload each photo
            for (let i = 0; i < cachedPhotos.length; i++) {
                const cachedPhoto = cachedPhotos[i];

                try {
                    // Update uploading state
                    setCachedPhotos((prev) =>
                        prev.map((p) =>
                            p.id === cachedPhoto.id
                                ? { ...p, uploading: true, uploadProgress: 0 }
                                : p
                        )
                    );

                    // Upload via secure server endpoint
                    const uploadedPhoto = await uploadPhotoSecurely(cachedPhoto);
                    uploadedPhotos.push(uploadedPhoto);

                    // Update success state
                    setCachedPhotos((prev) =>
                        prev.map((p) =>
                            p.id === cachedPhoto.id
                                ? { 
                                    ...p, 
                                    uploading: false, 
                                    uploadProgress: 100,
                                    imagekitFileId: uploadedPhoto.imagekitFileId,
                                    imagekitFilePath: uploadedPhoto.imagekitFilePath,
                                    url: uploadedPhoto.url,
                                }
                                : p
                        )
                    );

                    console.log(`[PhotoCache] Uploaded ${i + 1}/${cachedPhotos.length}:`, uploadedPhoto.imagekitFilePath);
                } catch (error) {
                    console.error('[PhotoCache] Failed to upload photo:', cachedPhoto.id, error);
                    
                    // Update error state
                    setCachedPhotos((prev) =>
                        prev.map((p) =>
                            p.id === cachedPhoto.id
                                ? { 
                                    ...p, 
                                    uploading: false, 
                                    error: error instanceof Error ? error.message : 'Upload failed',
                                }
                                : p
                        )
                    );

                    throw error; // Stop on first error
                }
            }

            console.log('[PhotoCache] All photos uploaded successfully');
            return uploadedPhotos;
        } catch (error) {
            console.error('[PhotoCache] Upload failed:', error);
            toast.error('Failed to upload photos');
            throw error;
        } finally {
            setIsUploading(false);
        }
    }, [cachedPhotos, uploadPhotoSecurely]);

    /**
     * Clear all cached photos
     */
    const clearCache = useCallback((): void => {
        console.log('[PhotoCache] Clearing cache, photos:', cachedPhotos.length);
        
        // Revoke all object URLs
        cachedPhotos.forEach((photo) => {
            URL.revokeObjectURL(photo.preview);
            objectUrlsRef.current.delete(photo.preview);
        });

        setCachedPhotos([]);
    }, [cachedPhotos]);

    // Memoize the return object so it only changes when cachedPhotos or isUploading changes
    return useMemo(() => ({
        cachedPhotos,
        addPhoto,
        removePhoto,
        updateCaption,
        setPrimary,
        uploadAllToImageKit,
        clearCache,
        isUploading,
        hasPhotos: cachedPhotos.length > 0,
    }), [cachedPhotos, addPhoto, removePhoto, updateCaption, setPrimary, uploadAllToImageKit, clearCache, isUploading]);
}
