'use client';

import { useState, useRef, useEffect } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { IMAGEKIT_URL_ENDPOINT, getImageKitFolder } from '@/lib/imagekit';
import Image from 'next/image';
import Link from 'next/link';
import { ImageEditor } from './ImageEditor';
import BannerEditor from './BannerEditor';

// ImageKit authenticator
const authenticator = async () => {
    try {
        const response = await fetch('/api/imagekit/auth');
        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('ImageKit auth error:', error);
        throw error;
    }
};

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
    const avatarUploadRef = useRef<HTMLInputElement | null>(null);
    const bannerUploadRef = useRef<HTMLInputElement | null>(null);

    // Sync preview states with user data
    useEffect(() => {
        if (user?.avatar) {
            setAvatarPreview(user.avatar);
        }
        if (user?.bannerImage) {
            setBannerPreview(user.bannerImage);
        }
    }, [user?.avatar, user?.bannerImage]);

    // Avatar handlers
    const onAvatarError = (err: any) => {
        console.error('Avatar upload error:', err);
        toast.error(err?.message || 'Failed to upload avatar');
        setIsUploadingAvatar(false);
    };

    const onAvatarSuccess = async (res: any) => {
        try {
            const response = await fetch('/api/auth/avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl: res.url, fileId: res.fileId }),
            });

            const result = await response.json();
            if (!response.ok) {
                toast.error(result.error || 'Failed to update avatar');
                return;
            }

            toast.success('Avatar updated successfully');
            setAvatarPreview(res.url);
            await refetchUser();
        } catch (error) {
            console.error('Avatar update error:', error);
            toast.error('Failed to update avatar');
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
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setEditorOpen(true);
        }
    };

    const handleEditorSave = async (croppedBlob: Blob, fileName: string) => {
        try {
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            if (avatarUploadRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                avatarUploadRef.current.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                avatarUploadRef.current.dispatchEvent(event);
            }
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
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Image must be less than 10MB');
                return;
            }
            setSelectedBannerFile(file);
            setBannerEditorOpen(true);
        }
    };

    const handleBannerEditorSave = async (croppedBlob: Blob) => {
        try {
            const fileName = selectedBannerFile?.name || 'banner.jpg';
            const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });
            if (bannerUploadRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                bannerUploadRef.current.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                bannerUploadRef.current.dispatchEvent(event);
            }
            
            // Close the editor
            setBannerEditorOpen(false);
            setSelectedBannerFile(null);
        } catch (error) {
            console.error('Error uploading edited banner:', error);
            toast.error('Failed to upload edited banner');
        }
    };

    const onBannerError = (err: any) => {
        console.error('Banner upload error:', err);
        toast.error(err?.message || 'Failed to upload banner');
        setIsUploadingBanner(false);
    };

    const onBannerSuccess = async (res: any) => {
        try {
            const response = await fetch('/api/auth/banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannerUrl: res.url, fileId: res.fileId }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                toast.error(result.error || 'Failed to update banner');
                return;
            }

            toast.success('Banner updated successfully');
            setBannerPreview(res.url);
            await refetchUser();
        } catch (error) {
            console.error('Banner update error:', error);
            toast.error('Failed to update banner');
        } finally {
            setIsUploadingBanner(false);
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

                {/* Hidden ImageKit upload (triggered after editing) */}
                <IKContext
                    publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                    urlEndpoint={IMAGEKIT_URL_ENDPOINT}
                    authenticator={authenticator}
                >
                    <IKUpload
                        ref={bannerUploadRef}
                        fileName={`banner-${user?.id}-${Date.now()}`}
                        folder={getImageKitFolder(`users/${user?.id}/banners`)}
                        tags={['banner', 'profile']}
                        useUniqueFileName={true}
                        onError={onBannerError}
                        onSuccess={onBannerSuccess}
                        onUploadStart={() => {
                            setIsUploadingBanner(true);
                            toast.info('Uploading banner...');
                        }}
                        className="hidden"
                        accept="image/*"
                        transformation={{
                            post: [{ type: 'transformation', value: 'w-1200,h-400,c-at_max' }],
                        }}
                    />
                </IKContext>

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

                        {/* Hidden ImageKit upload (triggered after editing) */}
                        <IKContext
                            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                            urlEndpoint={IMAGEKIT_URL_ENDPOINT}
                            authenticator={authenticator}
                        >
                            <IKUpload
                                ref={avatarUploadRef}
                                fileName={`avatar-${user?.id}-${Date.now()}`}
                                folder={getImageKitFolder(`users/${user?.id}/avatars`)}
                                tags={['avatar', 'profile']}
                                useUniqueFileName={true}
                                onError={onAvatarError}
                                onSuccess={onAvatarSuccess}
                                onUploadStart={() => {
                                    setIsUploadingAvatar(true);
                                    toast.info('Uploading avatar...');
                                }}
                                className="hidden"
                                accept="image/*"
                                transformation={{
                                    post: [{ type: 'transformation', value: 'w-400,h-400,c-at_max' }],
                                }}
                            />
                        </IKContext>

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
                            <Link href={`/@${user?.username}`} className="inline-block mt-2">
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
