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
import { TOAST } from '@/lib/constants/messages';
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
    const confirmPassword = watch('confirmPassword');

    // Check if passwords match in real-time
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const passwordsDontMatch = newPassword && confirmPassword && newPassword !== confirmPassword;

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
                toast.error(result.error || TOAST.PROFILE.PASSWORD_FAILED);
                return;
            }

toast.success(TOAST.PROFILE.PASSWORD_CHANGED);

            // Clear form
            reset();

            // Redirect to login after short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            console.error('Change password error:', error);
            toast.error(TOAST.GENERIC.UNEXPECTED);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Change Password
                </CardTitle>
                <CardDescription>
                    Update your password to keep your account secure
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
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
                                className={`pl-9 pr-10 ${errors.currentPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={errors.currentPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
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
                            <p className="text-sm text-destructive font-medium">{errors.currentPassword.message}</p>
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
                                className={`pl-9 pr-10 ${errors.newPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={errors.newPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
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
                            <p className="text-sm text-destructive font-medium">{errors.newPassword.message}</p>
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
                                                    ? 'bg-destructive'
                                                    : passwordStrength <= 3
                                                        ? 'bg-warning'
                                                        : 'bg-success'
                                                : 'bg-muted'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
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
                                className={`pl-9 pr-20 ${errors.confirmPassword
                                    ? 'border-destructive focus-visible:ring-destructive'
                                    : passwordsMatch
                                        ? 'border-success focus-visible:ring-success'
                                        : passwordsDontMatch
                                            ? 'border-destructive focus-visible:ring-destructive'
                                            : ''
                                    }`}
                                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                            />
                            {/* Password Match Indicator */}
                            {confirmPassword && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    {passwordsMatch ? (
                                        <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : passwordsDontMatch ? (
                                        <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : null}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {/* Real-time feedback message */}
                        {confirmPassword && !errors.confirmPassword && (
                            <p className={`text-sm font-medium ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                        {/* Validation error message */}
                        {errors.confirmPassword && (
                            <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Requirements */}
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-sm text-primary font-medium">Password Requirements:</p>
                        <ul className="text-xs text-primary mt-1 space-y-0.5 list-disc list-inside">
                            <li>At least 8 characters long</li>
                            <li>One uppercase letter (A-Z)</li>
                            <li>One lowercase letter (a-z)</li>
                            <li>One number (0-9)</li>
                        </ul>
                    </div>

                    {/* Warning */}
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                        <p className="text-sm text-warning">
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
