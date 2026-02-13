'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { FILE_SIZE_LIMITS } from '@/lib/constants/upload';
import { needsConversion, convertToJpeg } from '@/lib/image-converter';

interface BannerUploadProps {
    currentBanner?: string | null;
}

export function BannerUpload({ currentBanner }: BannerUploadProps) {
    const { user, refetchUser } = useAuth();
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentBanner || null);
    const [imageError, setImageError] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    /**
     * Upload banner image to secure API endpoint
     */
    const uploadBanner = async (file: File): Promise<void> => {
        setIsUploading(true);
        toast.info('Uploading banner...');

        try {
            const formData = new FormData();
            formData.append('banner', file);

            const response = await fetch('/api/auth/banner', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to upload banner');
            }

            toast.success('Banner updated successfully');
            setPreviewUrl(result.bannerUrl);
            await refetchUser();
        } catch (error) {
            console.error('Banner upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload banner');
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
        const maxSizeMB = FILE_SIZE_LIMITS.BANNER;
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Banner must be less than ${maxSizeMB}MB`);
            return;
        }

        try {
            let fileToUpload = file;

            // Convert HEIC/TIFF to JPEG if needed
            if (needsConversion(file)) {
                setIsConverting(true);
                toast.info(`Converting ${file.name} to JPEG...`);

                try {
                    const convertedBlob = await convertToJpeg(file);
                    const newFilename = file.name.replace(/\.(heic|heif|tif|tiff)$/i, '.jpg');
                    fileToUpload = new File([convertedBlob], newFilename, { type: 'image/jpeg' });
                    console.log('✅ Banner conversion complete:', newFilename);
                } catch (conversionError) {
                    console.error('❌ Banner conversion failed:', conversionError);
                    toast.error('Failed to convert image format');
                    setIsConverting(false);
                    return;
                } finally {
                    setIsConverting(false);
                }
            }

            // Upload the (potentially converted) file
            uploadBanner(fileToUpload);
        } catch (error) {
            console.error('Error processing banner file:', error);
            toast.error('Failed to process image');
        }
    };

    return (
        <div className="relative w-full h-[240px] md:h-[300px] group overflow-hidden rounded-t-lg">
            {/* Banner Image */}
            {previewUrl && !imageError ? (
                <Image
                    src={`${previewUrl}?tr=w-1200,h-400,c-at_max,fo-auto,q-85`}
                    alt="Profile banner"
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImageError(true)}
                    unoptimized={previewUrl.startsWith('data:')}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
            )}

            {/* Overlay for better visibility */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

            {/* Upload Button */}
            <div className="absolute bottom-4 right-4 z-10">
                <label
                    htmlFor="banner-upload"
                    className={`flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg shadow-lg transition-all cursor-pointer ${
                        isUploading || isConverting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Change banner image"
                >
                    {isConverting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                        {isConverting ? 'Converting...' : isUploading ? 'Uploading...' : 'Edit Banner'}
                    </span>
                </label>
                <input
                    id="banner-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading || isConverting}
                />
            </div>
        </div>
    );
}
