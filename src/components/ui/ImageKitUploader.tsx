"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { FOLDER_PATHS } from "@/lib/constants/upload";
import { usePhotoCacheManager } from "@/hooks/usePhotoCacheManager";
import type { CachedPhoto, UploadedPhotoData } from "@/types/photo-cache";

interface UploadedPhoto {
    id?: number; // Database ID (if already saved)
    imagekitFileId: string;
    imagekitFilePath: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    url: string; // Preview URL
    isPrimary?: boolean;
    caption?: string;
}

type UploadMode = 'immediate' | 'deferred';

interface ImageKitUploaderProps {
    onPhotosChange?: (photos: UploadedPhoto[]) => void;
    maxPhotos?: number;
    maxFileSize?: number; // in MB
    existingPhotos?: UploadedPhoto[];
    showPhotoGrid?: boolean; // Whether to show the photo grid preview
    uploadMode?: UploadMode; // 'immediate' (default) or 'deferred' (cache first)
    onCachedPhotosChange?: (cachedPhotos: CachedPhoto[]) => void; // For deferred mode
    onUploadReady?: (uploadFn: () => Promise<UploadedPhotoData[]>) => void; // Expose upload function
}
import { FILE_SIZE_LIMITS, PHOTO_LIMITS } from '@/lib/constants/upload';

// Placeholder text constants
const PLACEHOLDER_TEXT = {
    CAPTION_DEFERRED: 'Add caption (100 chars max)',
    CAPTION_IMMEDIATE: 'Add caption (100 chars max)',
    UPLOAD_PROMPT: 'Drop & Drag or Click to Upload',
    UPLOADING: 'Uploading and compressing...',
} as const;

export function ImageKitUploader({
    onPhotosChange,
    maxPhotos = PHOTO_LIMITS.MAX_PHOTOS_PER_LOCATION,
    maxFileSize = FILE_SIZE_LIMITS.PHOTO,
    existingPhotos = [],
    showPhotoGrid = true, // Default to true for backward compatibility
    uploadMode = 'immediate', // Default to immediate for backward compatibility
    onCachedPhotosChange,
    onUploadReady,
}: ImageKitUploaderProps) {
    const { user } = useAuth();
    
    // Initialize photo cache manager for deferred mode
    const photoCacheManager = usePhotoCacheManager({
        maxPhotos,
        maxFileSize,
    });
    
    // Destructure for stable references in dependencies
    const { cachedPhotos: cachedPhotosArray } = photoCacheManager;
    
    console.log('[ImageKitUploader] RENDER - Cached photos count:', cachedPhotosArray.length);

    // Choose mode: immediate upload (default) or deferred (cache first)
    const isDeferred = uploadMode === 'deferred';
    
    // State for immediate mode
    const [photos, setPhotos] = useState<UploadedPhoto[]>(existingPhotos);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevExistingPhotosRef = useRef<string>(JSON.stringify(existingPhotos));
    
    // Expose cached photos for deferred mode
    useEffect(() => {
        if (isDeferred) {
            console.log('[ImageKitUploader] Exposing cached photos:', cachedPhotosArray.length, cachedPhotosArray);
            onCachedPhotosChange?.(cachedPhotosArray);
        }
    }, [isDeferred, cachedPhotosArray, onCachedPhotosChange]);
    
    // Expose upload function for deferred mode
    useEffect(() => {
        if (isDeferred && onUploadReady) {
            console.log('[ImageKitUploader] Exposing upload function');
            onUploadReady(photoCacheManager.uploadAllToImageKit);
        }
    }, [isDeferred, onUploadReady, photoCacheManager.uploadAllToImageKit]);

    // Update photos when existingPhotos prop changes (comparing to previous value, not current state)
    useEffect(() => {
        const existingPhotosJson = JSON.stringify(existingPhotos);

        // Only update if existingPhotos actually changed from last time
        if (existingPhotosJson !== prevExistingPhotosRef.current) {
            prevExistingPhotosRef.current = existingPhotosJson;
            setPhotos(existingPhotos);
        }
    }, [existingPhotos]);

    // Fetch ImageKit auth parameters
    const getAuthParams = async () => {
        try {
            const response = await fetch('/api/imagekit/auth', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to get authentication');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting ImageKit auth:', error);
            toast.error('Failed to authenticate for photo upload');
            throw error;
        }
    };

    // Compress image to target size
    const compressImage = async (file: File, maxSizeMB: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate scaling to reduce file size
                    const maxDimension = 1920; // Max width/height
                    if (width > height && width > maxDimension) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Try different quality levels to hit target size
                    let quality = 0.9;
                    const tryCompress = () => {
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Compression failed'));
                                    return;
                                }

                                const sizeMB = blob.size / (1024 * 1024);
                                if (sizeMB <= maxSizeMB || quality <= 0.5) {
                                    resolve(blob);
                                } else {
                                    quality -= 0.1;
                                    tryCompress();
                                }
                            },
                            file.type,
                            quality
                        );
                    };

                    tryCompress();
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    // Upload photo to ImageKit
    const uploadToImageKit = async (file: File): Promise<UploadedPhoto> => {
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Compress image first
            const compressedBlob = await compressImage(file, maxFileSize);
            const compressedFile = new File([compressedBlob], file.name, {
                type: file.type,
            });

            // Get auth parameters
            const authParams = await getAuthParams();

            // Prepare form data
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('publicKey', authParams.publicKey);
            formData.append('signature', authParams.signature);
            formData.append('expire', authParams.expire);
            formData.append('token', authParams.token);
            formData.append('fileName', file.name);

            // Flat user directory structure (scalable, environment-separated)
            // All photos go to /production/users/{userId}/photos/ (database manages location relationships)
            const uploadFolder = FOLDER_PATHS.userPhotos(user.id);
            console.log('[ImageKitUploader] Uploading to folder:', uploadFolder);
            formData.append('folder', uploadFolder);

            // Upload to ImageKit
            const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.message || 'Upload failed');
            }

            const uploadResult = await uploadResponse.json();
            
            console.log('[ImageKitUploader] Upload successful! File path:', uploadResult.filePath);

            // Create photo object
            const photo: UploadedPhoto = {
                imagekitFileId: uploadResult.fileId,
                imagekitFilePath: uploadResult.filePath,
                originalFilename: file.name,
                fileSize: compressedFile.size,
                mimeType: file.type,
                width: uploadResult.width,
                height: uploadResult.height,
                url: uploadResult.url,
            };

            return photo;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    // Handle file selection
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        
        // Get current count based on mode
        const currentCount = isDeferred ? photoCacheManager.cachedPhotos.length : photos.length;

        // Check max photos limit
        if (currentCount + fileArray.length > maxPhotos) {
            toast.error(`Maximum ${maxPhotos} photos allowed`);
            return;
        }

        // Validate file types
        const validFiles = fileArray.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // DEFERRED MODE: Add to cache (no upload yet)
        if (isDeferred) {
            console.log('[ImageKitUploader] DEFERRED MODE - Adding photos to cache:', validFiles.length);
            console.log('[ImageKitUploader] photoCacheManager:', photoCacheManager);
            console.log('[ImageKitUploader] photoCacheManager.addPhoto:', photoCacheManager.addPhoto);
            
            for (const file of validFiles) {
                try {
                    console.log('[ImageKitUploader] Calling addPhoto for:', file.name);
                    await photoCacheManager.addPhoto(file);
                    console.log('[ImageKitUploader] addPhoto returned for:', file.name);
                } catch (error) {
                    console.error('[ImageKitUploader] addPhoto threw error:', error);
                    const message = error instanceof Error ? error.message : 'Failed to add photo';
                    toast.error(message);
                }
            }
            // Note: State update is async, actual count will be logged by useEffect
            // Success toast removed - user can see photos displayed in the form
            return;
        }

        // IMMEDIATE MODE: Upload to ImageKit now
        setUploading(true);

        try {
            const uploadPromises = validFiles.map(file => uploadToImageKit(file));
            const uploadedPhotos = await Promise.all(uploadPromises);

            const newPhotos = [...photos, ...uploadedPhotos];
            setPhotos(newPhotos);
            onPhotosChange?.(newPhotos);

            toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload photos';
            toast.error(message);
        } finally {
            setUploading(false);
        }
    };

    // Handle drag and drop
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            void handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    // Handle remove photo
    const handleRemove = async (index: number) => {
        const photoToRemove = photos[index];

        // Show confirmation dialog
        const confirmMessage = photoToRemove.id
            ? 'This will permanently remove the photo from storage. Are you sure?'
            : 'Remove this photo?';

        if (!window.confirm(confirmMessage)) {
            return; // User cancelled
        }

        // If photo has a database ID, delete from server (ImageKit + DB)
        if (photoToRemove.id) {
            try {
                const response = await fetch(`/api/photos/${photoToRemove.id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete photo');
                }

                toast.success('Photo deleted successfully');
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to delete photo';
                console.error('Error deleting photo:', error);
                toast.error(message);
                return; // Don't remove from UI if server deletion failed
            }
        }

        // Remove from local state (for both new uploads and successfully deleted DB photos)
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onPhotosChange?.(newPhotos);
    };

    // Handle caption update
    const handleCaptionChange = (index: number, caption: string) => {
        const newPhotos = [...photos];
        newPhotos[index] = { ...newPhotos[index], caption };
        setPhotos(newPhotos);
        onPhotosChange?.(newPhotos);
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
border - 2 border - dashed rounded - lg p - 8 text - center cursor - pointer
transition - colors duration - 200
                    ${dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    disabled={uploading || (isDeferred ? photoCacheManager.cachedPhotos.length >= maxPhotos : photos.length >= maxPhotos)}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{PLACEHOLDER_TEXT.UPLOADING}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Camera className="w-10 h-10 text-green-600" />
                        <div className="text-center">
                            <p className="text-sm font-medium">{PLACEHOLDER_TEXT.UPLOAD_PROMPT}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                JPG or HEIC • Max {maxFileSize}MB • Up to {maxPhotos} photos
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isDeferred ? photoCacheManager.cachedPhotos.length : photos.length} of {maxPhotos} photos {isDeferred ? 'ready' : 'uploaded'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Photo Previews - Show based on mode */}
            {showPhotoGrid && (
                <>
                    {/* DEFERRED MODE: Show cached photos */}
                    {isDeferred && photoCacheManager.cachedPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {photoCacheManager.cachedPhotos.map((cachedPhoto) => (
                                <div key={cachedPhoto.id} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden border bg-muted group">
                                        {/* Use Object URL preview */}
                                        <img
                                            src={cachedPhoto.preview}
                                            alt={cachedPhoto.originalFilename}
                                            className="w-full h-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                                            onClick={() => photoCacheManager.removePhoto(cachedPhoto.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        {/* Show uploading state if applicable */}
                                        {cachedPhoto.uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Caption input */}
                                    <input
                                        type="text"
                                        placeholder={PLACEHOLDER_TEXT.CAPTION_DEFERRED}
                                        value={cachedPhoto.caption || ''}
                                        onChange={(e) => photoCacheManager.updateCaption(cachedPhoto.id, e.target.value)}
                                        maxLength={100}
                                        className="w-full mt-2 text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {cachedPhoto.originalFilename} • {(cachedPhoto.fileSize / 1024).toFixed(0)} KB
                                        {cachedPhoto.width && cachedPhoto.height && ` • ${cachedPhoto.width}x${cachedPhoto.height}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* IMMEDIATE MODE: Show uploaded photos */}
                    {!isDeferred && photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative group">
                                    <div className="aspect-square rounded-lg overflow-hidden border bg-muted group">
                                        <img
                                            src={photo.url}
                                            alt={photo.originalFilename}
                                            className="w-full h-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6"
                                            onClick={() => handleRemove(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {/* Caption input */}
                                    <input
                                        type="text"
                                        placeholder={PLACEHOLDER_TEXT.CAPTION_IMMEDIATE}
                                        value={photo.caption || ''}
                                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                                        maxLength={100}
                                        className="w-full mt-2 text-xs px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {photo.originalFilename} • {(photo.fileSize / 1024).toFixed(0)} KB
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
