'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Email validation schema
const changeEmailSchema = z.object({
    newEmail: z.string()
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim()
        .max(255, 'Email address is too long'),
    currentPassword: z.string().min(1, 'Current password is required'),
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export function ChangeEmailForm() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
    } = useForm<ChangeEmailFormData>({
        resolver: zodResolver(changeEmailSchema),
        defaultValues: {
            newEmail: '',
            currentPassword: '',
        },
    });

    const newEmail = watch('newEmail');

    const onSubmit = async (data: ChangeEmailFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/change-email/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                // SPECIFIC ERROR MESSAGES
                if (result.code === 'EMAIL_ALREADY_EXISTS') {
                    toast.error('Email Already Registered', {
                        description: 'This email address is already registered to another account. Please use a different email.',
                    });
                } else if (result.code === 'SAME_EMAIL') {
                    toast.error('Same Email', {
                        description: 'New email address is the same as your current email.',
                    });
                } else if (result.code === 'RATE_LIMITED_DAILY') {
                    toast.error('Too Many Requests', {
                        description: 'You can only change your email once per 24 hours. Please try again tomorrow.',
                    });
                } else if (result.code === 'RATE_LIMITED_YEARLY') {
                    toast.error('Annual Limit Reached', {
                        description: 'You have reached the maximum of 5 email changes per year. Please contact support if you need assistance.',
                    });
                } else if (result.code === 'INVALID_PASSWORD') {
                    toast.error('Incorrect Password', {
                        description: 'The password you entered is incorrect.',
                    });
                } else {
                    toast.error(result.error || 'Failed to change email');
                }
                setIsLoading(false);
                return;
            }

            // Success
            toast.success('Verification Email Sent', {
                description: 'Please check your new email address to confirm the change. We also sent an alert to your current email.',
                duration: 6000,
            });

            reset();
        } catch (error) {
            console.error('Email change error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    Change Email Address
                </CardTitle>
                <CardDescription>
                    Update your email address. You'll need to verify the new email before it takes effect.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
                    {/* Current Email (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="currentEmail">Current Email</Label>
                        <Input
                            id="currentEmail"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    {/* New Email */}
                    <div className="space-y-2">
                        <Label htmlFor="newEmail">New Email Address</Label>
                        <Input
                            id="newEmail"
                            type="email"
                            placeholder="Enter new email address"
                            {...register('newEmail')}
                            disabled={isLoading}
                            className={errors.newEmail ? 'border-destructive focus-visible:ring-destructive' : ''}
                            aria-invalid={errors.newEmail ? 'true' : 'false'}
                        />
                        {errors.newEmail && (
                            <p className="text-sm text-destructive font-medium">{errors.newEmail.message}</p>
                        )}
                    </div>

                    {/* Current Password */}
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your current password"
                                {...register('currentPassword')}
                                disabled={isLoading}
                                className={errors.currentPassword ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                                aria-invalid={errors.currentPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? (
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

                    {/* Warning Alert */}
                    <div className="flex gap-3 p-4 rounded-lg border border-warning/20 bg-warning/10 dark:border-warning dark:bg-warning/10">
                        <AlertTriangle className="h-5 w-5 text-warning dark:text-warning flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-warning dark:text-warning-foreground">
                            <strong>Important:</strong> After changing your email, you'll be logged out of all devices for security.
                            You'll need to verify your new email address before you can log in again.
                        </div>
                    </div>

                    {/* Rate Limit Info */}
                    <p className="text-sm text-muted-foreground">
                        You can change your email once per 24 hours (maximum 5 times per year).
                    </p>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !newEmail || errors.newEmail !== undefined}
                    >
                        {isLoading ? 'Processing...' : 'Change Email Address'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
