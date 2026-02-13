'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import Link from 'next/link';
import { ImageEditor } from './ImageEditor';
import BannerEditor from './BannerEditor';
import { FILE_SIZE_LIMITS } from '@/lib/constants/upload';

export function ProfileHeader() {
    const { user, refetchUser } = useAuth();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(user?.bannerImage || null);
    const [avatarError, setAvatarError] = useState(false);
    const [bannerError, setBannerError] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [bannerEditorOpen, setBannerEditorOpen] = useState(false);

    // Sync preview states with user data
    useEffect(() => {
        if (user?.avatar) {
            setAvatarPreview(user.avatar);
        }
        if (user?.bannerImage) {
            setBannerPreview(user.bannerImage);
        }
    }, [user?.avatar, user?.bannerImage]);

    /**
     * Upload avatar to secure API endpoint
     */
    const uploadAvatar = async (file: File): Promise<void> => {
        setIsUploadingAvatar(true);
        toast.info('Uploading avatar...');

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
            setAvatarPreview(result.avatarUrl);
            await refetchUser();
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            const maxSizeMB = FILE_SIZE_LIMITS.AVATAR;
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.error(`Image must be less than ${maxSizeMB}MB`);
                return;
            }
            setSelectedFile(file);
            setEditorOpen(true);
        }
    };

    const handleEditorSave = async (croppedBlob: Blob, fileName: string) => {
        try {
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            await uploadAvatar(file);
        } catch (error) {
            console.error('Error uploading edited image:', error);
            toast.error('Failed to upload edited image');
        }
    };

    // Banner handlers
    const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            const maxSizeMB = FILE_SIZE_LIMITS.BANNER;
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.error(`Image must be less than ${maxSizeMB}MB`);
                return;
            }
            setSelectedBannerFile(file);
            setBannerEditorOpen(true);
        }
    };

    /**
     * Upload banner to secure API endpoint
     */
    const uploadBanner = async (file: File): Promise<void> => {
        setIsUploadingBanner(true);
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
            setBannerPreview(result.bannerUrl);
            await refetchUser();
        } catch (error) {
            console.error('Banner upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload banner');
        } finally {
            setIsUploadingBanner(false);
        }
    };

    const handleBannerEditorSave = async (croppedBlob: Blob) => {
        try {
            const fileName = selectedBannerFile?.name || 'banner.jpg';
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            await uploadBanner(file);
            
            // Close the editor
            setBannerEditorOpen(false);
            setSelectedBannerFile(null);
        } catch (error) {
            console.error('Error uploading edited banner:', error);
            toast.error('Failed to upload edited banner');
        }
    };

    return (
        <>
            <Card className="overflow-hidden">
                {/* Banner Section */}
                <label 
                    htmlFor="banner-file-select"
                    className="relative w-full h-32 md:h-40 group block cursor-pointer"
                >
                    {/* Banner Image */}
                    {bannerPreview && !bannerError ? (
                        <Image
                            src={`${bannerPreview}?tr=w-1200,h-400,c-at_max,fo-auto,q-85`}
                            alt="Profile banner"
                            fill
                            className="object-cover"
                            priority
                            onError={() => setBannerError(true)}
                            unoptimized={bannerPreview.startsWith('data:')}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                    )}

                    {/* Banner Overlay - shows on hover */}
                    <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                        isUploadingBanner ? 'opacity-100' : ''
                    }`}>
                        <div className="flex flex-col items-center gap-3">
                            <Camera className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            <span className="text-base md:text-lg text-white font-semibold">
                                {isUploadingBanner ? 'Uploading...' : 'Edit'}
                            </span>
                        </div>
                    </div>

                    {/* Hidden file input for banner selection */}
                    <input
                        id="banner-file-select"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerSelect}
                        className="hidden"
                        disabled={isUploadingBanner}
                    />
                </label>

                {/* Avatar and User Info Section */}
                <div className="relative px-4 md:px-6 pb-4">
                    {/* Avatar positioned overlapping the banner */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 -mt-12 md:-mt-14">
                        {/* Avatar */}
                        <label 
                            htmlFor="avatar-file-select"
                            className="relative group cursor-pointer"
                        >
                            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-background bg-background overflow-hidden shadow-xl">
                                {avatarPreview && !avatarError ? (
                                    <Image
                                        src={`${avatarPreview}?tr=w-400,h-400,c-at_max,fo-auto,q-90`}
                                        alt={user?.username || 'Avatar'}
                                        fill
                                        className="object-cover"
                                        onError={() => setAvatarError(true)}
                                        unoptimized={avatarPreview.startsWith('data:')}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                        <span className="text-5xl font-bold text-white">
                                            {user?.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}

                                {/* Avatar upload overlay - shows on hover */}
                                <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
                                    isUploadingAvatar ? 'opacity-100' : ''
                                }`}>
                                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                            </div>

                            {/* Hidden file input for avatar selection */}
                            <input
                                id="avatar-file-select"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarSelect}
                                className="hidden"
                                disabled={isUploadingAvatar}
                            />
                        </label>

                        {/* User Info */}
                        <div className="flex-1 sm:mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                                <h2 className="text-xl md:text-2xl font-bold">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user?.username}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>@{user?.username}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="truncate max-w-[200px]">{user?.email}</span>
                                </div>
                            </div>
                            
                            {/* View Public Profile Button */}
                            <Link href={`/${user?.username}`} className="inline-block mt-2">
                                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                                    <ExternalLink className="w-3 h-3" />
                                    View Public Profile
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
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
            
            {/* Banner Editor Modal */}
            {selectedBannerFile && (
                <BannerEditor
                    isOpen={bannerEditorOpen}
                    onClose={() => {
                        setBannerEditorOpen(false);
                        setSelectedBannerFile(null);
                    }}
                    imageUrl={URL.createObjectURL(selectedBannerFile)}
                    onSave={handleBannerEditorSave}
                />
            )}
        </>
    );
}
