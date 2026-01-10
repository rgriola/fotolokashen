'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getOptimizedAvatarUrl } from '@/lib/imagekit';

interface AvatarUploadProps {
    currentAvatar?: string | null;
}

export function AvatarUpload({ currentAvatar }: AvatarUploadProps) {
    const { user, refetchUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        await uploadAvatar(file);
    };

    const uploadAvatar = async (file: File) => {
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/auth/avatar', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to upload avatar');
                // Reset preview on error
                setPreviewUrl(currentAvatar || null);
                return;
            }

            toast.success('Avatar updated successfully');

            // Refresh user data to get new avatar URL
            await refetchUser();
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Failed to upload avatar');
            setPreviewUrl(currentAvatar || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!currentAvatar) return;

        setIsUploading(true);

        try {
            const response = await fetch('/api/auth/avatar', {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to remove avatar');
                return;
            }

            toast.success('Avatar removed successfully');
            setPreviewUrl(null);

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Avatar removal error:', error);
            toast.error('Failed to remove avatar');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardContent className="py-4 px-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* User Info - Left side on desktop */}
                    <div className="flex-1 text-center md:text-left order-2 md:order-1">
                        <p className="font-semibold text-lg">
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.username}
                        </p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Square image, at least 400x400px • Max 5MB
                        </p>
                    </div>

                    {/* Avatar Display - Right side on desktop */}
                    <div className="relative flex-shrink-0 order-1 md:order-2">
                        <div className="w-[106px] h-[106px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                            {previewUrl ? (
                                <Image
                                    src={getOptimizedAvatarUrl(previewUrl, 128) || previewUrl}
                                    alt="Profile avatar"
                                    width={120}
                                    height={120}
                                    className="w-full h-full object-cover"
                                    priority
                                    onError={() => {
                                        // If image fails to load, show fallback
                                        setPreviewUrl(null);
                                    }}
                                />
                            ) : (
                                <User className="w-14 h-14 md:w-16 md:h-16 text-white" />
                            )}
                        </div>

                        {/* Camera Icon Overlay - Upload button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50"
                            title="Change avatar"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
