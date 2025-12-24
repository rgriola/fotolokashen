'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, X, User } from 'lucide-react';
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
                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Avatar Display */}
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                            {previewUrl ? (
                                <Image
                                    src={getOptimizedAvatarUrl(previewUrl, 128) || previewUrl}
                                    alt="Profile avatar"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    priority
                                />
                            ) : (
                                <User className="w-12 h-12 text-white" />
                            )}
                        </div>

                        {/* Camera Icon Overlay */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors disabled:opacity-50"
                            title="Change avatar"
                        >
                            <Camera className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* User Info & Actions */}
                    <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-3 w-full">
                        {/* User Info */}
                        <div className="text-center md:text-left flex-1">
                            <p className="font-semibold text-base">
                                {user?.firstName && user?.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user?.username}
                            </p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Square image, at least 400x400px • Max 5MB
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>

                            {currentAvatar && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    disabled={isUploading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
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
