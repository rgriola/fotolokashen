'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';

// Validation schema
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ['newPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    const newPassword = watch('newPassword');

    // Password strength indicator
    const getPasswordStrength = (pass: string): number => {
        if (!pass) return 0;
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[a-z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const onSubmit = async (data: ChangePasswordFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to change password');
                return;
            }

            toast.success('Password changed successfully! Logging you out...');

            // Clear form
            reset();

            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            console.error('Change password error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Change Password
                </CardTitle>
                <CardDescription>
                    Update your password to keep your account secure
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register('currentPassword')}
                                disabled={isLoading}
                                className={`pl-9 pr-10 ${errors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-invalid={errors.currentPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.currentPassword && (
                            <p className="text-sm text-red-500 font-medium">{errors.currentPassword.message}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register('newPassword')}
                                disabled={isLoading}
                                className={`pl-9 pr-10 ${errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-invalid={errors.newPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <p className="text-sm text-red-500 font-medium">{errors.newPassword.message}</p>
                        )}

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded ${i < passwordStrength
                                                ? passwordStrength <= 2
                                                    ? 'bg-red-500'
                                                    : passwordStrength <= 3
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                : 'bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600">
                                    {passwordStrength <= 2 && 'Weak'}
                                    {passwordStrength === 3 && 'Fair'}
                                    {passwordStrength === 4 && 'Good'}
                                    {passwordStrength === 5 && 'Strong'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register('confirmPassword')}
                                disabled={isLoading}
                                className={`pl-9 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 font-medium">Password Requirements:</p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                            <li>At least 8 characters long</li>
                            <li>One uppercase letter (A-Z)</li>
                            <li>One lowercase letter (a-z)</li>
                            <li>One number (0-9)</li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>⚠️ Important:</strong> Changing your password will log you out on all devices.
                        </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
