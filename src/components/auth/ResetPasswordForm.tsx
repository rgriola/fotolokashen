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
    const confirmPassword = watch('confirmPassword');

    // Check if passwords match in real-time
    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const passwordsDontMatch = password && confirmPassword && password !== confirmPassword;

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
                setIsLoading(false);
                return;
            }

            // Check if email verification is required
            if (result.requiresVerification) {
                toast.success('Password reset successful!');

                // Wait a moment for user to see the message
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Show verification required message
                toast.info('Please verify your email before logging in.');

                // Wait another moment
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Redirect to verify-email page with email parameter
                router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
                return;
            }

            // Email is verified - auto-login successful
            toast.success('Password reset successful! Logging you in...');

            // Wait for server to process and set cookies
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Redirect to map
            router.push('/map');
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
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
                                className={`pl-9 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                aria-invalid={errors.password ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
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
                            <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
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

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-sm text-primary font-medium">Password Requirements:</p>
                        <ul className="text-xs text-primary mt-1 space-y-0.5 list-disc list-inside">
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
