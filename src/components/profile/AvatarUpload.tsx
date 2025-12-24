'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, X, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

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
            <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                    {/* Avatar Display */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                            {previewUrl ? (
                                <Image
                                    src={previewUrl}
                                    alt="Profile avatar"
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-16 h-16 text-white" />
                            )}
                        </div>

                        {/* Camera Icon Overlay */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50"
                            title="Change avatar"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="text-center">
                        <p className="font-semibold text-lg">
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.username}
                        </p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex-1"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload Photo'}
                        </Button>

                        {currentAvatar && (
                            <Button
                                variant="outline"
                                onClick={handleRemoveAvatar}
                                disabled={isUploading}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Help Text */}
                    <p className="text-xs text-muted-foreground text-center">
                        Recommended: Square image, at least 400x400px
                        <br />
                        Max file size: 5MB (JPG, PNG, GIF)
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
