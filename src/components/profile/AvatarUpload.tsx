'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getOptimizedAvatarUrl } from '@/lib/imagekit';
import Image from 'next/image';
import { ImageEditor } from './ImageEditor';
import { FILE_SIZE_LIMITS } from '@/lib/constants/upload';
import { needsConversion, convertToJpeg } from '@/lib/image-converter';

interface AvatarUploadProps {
    currentAvatar?: string | null;
}

export function AvatarUpload({ currentAvatar }: AvatarUploadProps) {
    const { user, refetchUser } = useAuth();
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);

    // Sync preview with prop changes
    useEffect(() => {
        setPreviewUrl(currentAvatar || null);
        setImageError(false);
    }, [currentAvatar]);

    /**
     * Upload cropped image to secure API endpoint
     */
    const uploadAvatar = async (file: File): Promise<void> => {
        setIsUploading(true);
        toast.info('Uploading image...');

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/auth/avatar', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to upload avatar');
            }

            toast.success('Avatar updated successfully');
            setPreviewUrl(result.avatarUrl);

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size using global constant
        const maxSizeMB = FILE_SIZE_LIMITS.AVATAR;
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Image must be less than ${maxSizeMB}MB`);
            return;
        }

        try {
            let fileToEdit = file;

            // Convert HEIC/TIFF to JPEG if needed (for proper preview/editing)
            if (needsConversion(file)) {
                setIsConverting(true);
                toast.info(`Converting ${file.name} to JPEG...`);

                try {
                    const convertedBlob = await convertToJpeg(file);
                    const newFilename = file.name.replace(/\.(heic|heif|tif|tiff)$/i, '.jpg');
                    fileToEdit = new File([convertedBlob], newFilename, { type: 'image/jpeg' });
                    console.log('✅ Avatar conversion complete:', newFilename);
                } catch (conversionError) {
                    console.error('❌ Avatar conversion failed:', conversionError);
                    toast.error('Failed to convert image format');
                    setIsConverting(false);
                    return;
                } finally {
                    setIsConverting(false);
                }
            }

            setSelectedFile(fileToEdit);
            setEditorOpen(true);
        } catch (error) {
            console.error('Error processing avatar file:', error);
            toast.error('Failed to process image');
        }
    };

    const handleEditorSave = async (croppedBlob: Blob, fileName: string) => {
        try {
            // Convert blob to file and upload via secure API
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            await uploadAvatar(file);
        } catch (error) {
            console.error('Error uploading edited image:', error);
            toast.error('Failed to upload edited image');
        }
    };

    return (
        <>
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                <div className="relative h-[200px] md:h-[240px]">
                    {/* Background Image / Banner */}
                    <div className="absolute inset-0">
                        {previewUrl && !imageError ? (
                            <Image
                                src={getOptimizedAvatarUrl(previewUrl, 256) || previewUrl}
                                alt="Profile banner"
                                fill
                                className="object-cover"
                                priority
                                onError={() => {
                                    setImageError(true);
                                }}
                                unoptimized={previewUrl.startsWith('data:')}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
                        )}
                        {/* Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="relative h-full flex items-center px-6 md:px-8">
                        {/* User Info - Centered */}
                        <div className="text-white space-y-1 z-10 flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.username}
                            </h2>
                            <p className="text-base md:text-lg font-medium opacity-90">
                                @{user?.username}
                            </p>
                            <p className="text-sm md:text-base opacity-80">
                                {user?.email}
                            </p>
                        </div>

                        {/* Hover-triggered upload - Avatar-style circular area on right */}
                        <label
                            htmlFor="avatar-file-select"
                            className={`relative group flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden cursor-pointer z-10 ${
                                isUploading || isConverting ? 'cursor-not-allowed' : ''
                            }`}
                            title="Change profile image"
                        >
                            {/* Avatar preview */}
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 relative">
                                {previewUrl && !imageError ? (
                                    <Image
                                        src={getOptimizedAvatarUrl(previewUrl, 256) || previewUrl}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                        priority
                                        onError={() => setImageError(true)}
                                        unoptimized={previewUrl.startsWith('data:')}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                    </div>
                                )}

                                {/* Hover overlay with camera icon */}
                                <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                                    isUploading || isConverting ? 'opacity-100' : ''
                                }`}>
                                    {isConverting ? (
                                        <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Hidden file input for initial selection */}
                            <input
                                id="avatar-file-select"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isUploading || isConverting}
                            />
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Image Editor Modal */}
        <ImageEditor
            open={editorOpen}
            onClose={() => {
                setEditorOpen(false);
                setSelectedFile(null);
            }}
            imageFile={selectedFile}
            onSave={handleEditorSave}
        />
        </>
    );
}
