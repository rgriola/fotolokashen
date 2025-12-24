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
import { Eye, EyeOff, Lock } from 'lucide-react';

//Validation schema (same as registration)
const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const password = watch('password');

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

    const passwordStrength = getPasswordStrength(password);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to reset password');
                return;
            }

            toast.success('Password reset successful! Logging you in...');

            // Auto-login successful - redirect to map
            setTimeout(() => {
                window.location.href = '/map';
            }, 1000);
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
                <CardDescription>
                    Enter a strong password for your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...register('password')}
                                disabled={isLoading}
                                className={`pl-9 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-invalid={errors.password ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                        )}

                        {/* Password Strength Indicator */}
                        {password && (
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 font-medium">Password Requirements:</p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
                            <li>At least 8 characters long</li>
                            <li>One uppercase letter (A-Z)</li>
                            <li>One lowercase letter (a-z)</li>
                            <li>One number (0-9)</li>
                        </ul>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
