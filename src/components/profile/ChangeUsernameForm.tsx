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
import { User, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Username validation schema
const changeUsernameSchema = z.object({
    newUsername: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be 50 characters or less')
        .regex(/^[a-zA-Z0-9_-]{3,50}$/, 'Username can only contain letters, numbers, hyphens, and underscores')
        .toLowerCase()
        .trim(),
    currentPassword: z.string().min(1, 'Current password is required'),
});

type ChangeUsernameFormData = z.infer<typeof changeUsernameSchema>;

export function ChangeUsernameForm() {
    const { user, refetchUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
    } = useForm<ChangeUsernameFormData>({
        resolver: zodResolver(changeUsernameSchema),
        defaultValues: {
            newUsername: '',
            currentPassword: '',
        },
    });

    const newUsername = watch('newUsername');

    const onSubmit = async (data: ChangeUsernameFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/change-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                // SPECIFIC ERROR MESSAGES
                if (result.code === 'USERNAME_TAKEN') {
                    toast.error('Username Taken', {
                        description: 'This username is already taken. Please choose a different username.',
                    });
                } else if (result.code === 'USERNAME_RESERVED') {
                    toast.error('Username Reserved', {
                        description: 'This username is reserved and cannot be used.',
                    });
                } else if (result.code === 'SAME_USERNAME') {
                    toast.error('Same Username', {
                        description: 'New username is the same as your current username.',
                    });
                } else if (result.code === 'RATE_LIMITED_MONTHLY') {
                    toast.error('Too Many Changes', {
                        description: 'You can only change your username once per 30 days. Please try again later.',
                    });
                } else if (result.code === 'RATE_LIMITED_YEARLY') {
                    toast.error('Annual Limit Reached', {
                        description: 'You have reached the maximum of 3 username changes per year. Please contact support if you need assistance.',
                    });
                } else if (result.code === 'INVALID_PASSWORD') {
                    toast.error('Incorrect Password', {
                        description: 'The password you entered is incorrect.',
                    });
                } else {
                    toast.error(result.error || 'Failed to change username');
                }
                setIsLoading(false);
                return;
            }

            // Success
            toast.success('Username Changed!', {
                description: `Your username has been changed to @${result.username}`,
                duration: 5000,
            });

            reset();

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Username change error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <User className="w-5 h-5" />
                    Change Username
                </CardTitle>
                <CardDescription>
                    Update your username. Choose carefully - you can only change it once per month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
                    {/* Current Username (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="currentUsername">Current Username</Label>
                        <Input
                            id="currentUsername"
                            type="text"
                            value={user?.username || ''}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    {/* New Username */}
                    <div className="space-y-2">
                        <Label htmlFor="newUsername">New Username</Label>
                        <Input
                            id="newUsername"
                            type="text"
                            placeholder="Enter new username"
                            autoComplete="off"
                            {...register('newUsername')}
                            disabled={isLoading}
                            className={errors.newUsername ? 'border-destructive focus-visible:ring-destructive' : ''}
                            aria-invalid={errors.newUsername ? 'true' : 'false'}
                        />
                        {errors.newUsername && (
                            <p className="text-sm text-destructive font-medium">{errors.newUsername.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            3-50 characters. Letters, numbers, hyphens, and underscores only.
                        </p>
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
                            <strong>Important:</strong> You can only change your username once per 30 days (maximum 3 times per year).
                            Choose carefully!
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !newUsername || errors.newUsername !== undefined}
                    >
                        {isLoading ? 'Changing...' : 'Change Username'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
