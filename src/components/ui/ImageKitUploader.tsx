"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

interface ImageKitUploaderProps {
    placeId?: string;
    onPhotosChange?: (photos: UploadedPhoto[]) => void;
    maxPhotos?: number;
    maxFileSize?: number; // in MB
    existingPhotos?: UploadedPhoto[];
}

export function ImageKitUploader({
    placeId,
    onPhotosChange,
    maxPhotos = 20,
    maxFileSize = 1.5,
    existingPhotos = [],
}: ImageKitUploaderProps) {
    const [photos, setPhotos] = useState<UploadedPhoto[]>(existingPhotos);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const prevExistingPhotosRef = useRef<string>(JSON.stringify(existingPhotos));

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

            if (placeId) {
                formData.append('folder', `/locations/${placeId}`);
            }

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
        } catch (error: any) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    // Handle file selection
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        // Check max photos limit
        if (photos.length + fileArray.length > maxPhotos) {
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

        setUploading(true);

        try {
            const uploadPromises = validFiles.map(file => uploadToImageKit(file));
            const uploadedPhotos = await Promise.all(uploadPromises);

            const newPhotos = [...photos, ...uploadedPhotos];
            setPhotos(newPhotos);
            onPhotosChange?.(newPhotos);

            toast.success(`${uploadedPhotos.length} photo(s) uploaded successfully`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload photos');
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
            handleFiles(e.dataTransfer.files);
        }
    }, [photos]);

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
            } catch (error: any) {
                console.error('Error deleting photo:', error);
                toast.error(error.message || 'Failed to delete photo');
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
                    disabled={uploading || photos.length >= maxPhotos}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading and compressing...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                JPG, PNG, WebP • Max {maxFileSize}MB • Up to {maxPhotos} photos
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {photos.length} of {maxPhotos} photos uploaded
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Photo Previews */}
            {photos.length > 0 && (
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
                                placeholder="Add caption (optional)"
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
            )
            }
        </div >
    );
}
