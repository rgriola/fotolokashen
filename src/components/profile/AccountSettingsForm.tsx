'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Validation schema (matches backend validation)
const accountSettingsSchema = z.object({
    firstName: z.string()
        .max(50, 'First name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]*$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .optional()
        .or(z.literal('')),
    lastName: z.string()
        .max(50, 'Last name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]*$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .optional()
        .or(z.literal('')),
    bio: z.string()
        .max(500, 'Bio must be less than 500 characters')
        .optional()
        .or(z.literal('')),
    phoneNumber: z.string()
        .regex(/^[\d\s\-\+\(\)\.]*$/, 'Phone number can only contain numbers, spaces, and symbols: + - ( ) .')
        .refine(
            (val) => !val || val.replace(/[\s\-\+\(\)\.]/g, '').length >= 10,
            'Phone number must be at least 10 digits'
        )
        .refine(
            (val) => !val || val.length <= 20,
            'Phone number must be less than 20 characters'
        )
        .optional()
        .or(z.literal('')),
    city: z.string()
        .max(100, 'City must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-'\.]*$/, 'City can only contain letters, spaces, hyphens, apostrophes, and periods')
        .optional()
        .or(z.literal('')),
    country: z.string()
        .max(100, 'Country must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-'\.]*$/, 'Country can only contain letters, spaces, hyphens, apostrophes, and periods')
        .optional()
        .or(z.literal('')),
});

type AccountSettingsFormData = z.infer<typeof accountSettingsSchema>;

export function AccountSettingsForm() {
    const { user, refetchUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AccountSettingsFormData>({
        resolver: zodResolver(accountSettingsSchema),
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            bio: user?.bio || '',
            phoneNumber: user?.phoneNumber || '',
            city: user?.city || '',
            country: user?.country || '',
        },
    });

    const onSubmit = async (data: AccountSettingsFormData) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Failed to update profile');
                return;
            }

            toast.success('Profile updated successfully');

            // Refresh user data
            await refetchUser();
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                </CardTitle>
                <CardDescription>
                    Update your personal information and profile details
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="pl-9 bg-muted"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Email cannot be changed. Contact support if you need to update it.
                        </p>
                    </div>

                    {/* Username (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="username"
                                type="text"
                                value={user?.username || ''}
                                disabled
                                className="pl-9 bg-muted"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Username cannot be changed.
                        </p>
                    </div>

                    {/* First Name */}
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            {...register('firstName')}
                            disabled={isLoading}
                            className={errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            aria-invalid={errors.firstName ? 'true' : 'false'}
                        />
                        {errors.firstName && (
                            <p className="text-sm text-red-500 font-medium">{errors.firstName.message}</p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            {...register('lastName')}
                            disabled={isLoading}
                            className={errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            aria-invalid={errors.lastName ? 'true' : 'false'}
                        />
                        {errors.lastName && (
                            <p className="text-sm text-red-500 font-medium">{errors.lastName.message}</p>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="Tell us about yourself..."
                            rows={3}
                            {...register('bio')}
                            disabled={isLoading}
                            className={`resize-none ${errors.bio ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            aria-invalid={errors.bio ? 'true' : 'false'}
                        />
                        {errors.bio && (
                            <p className="text-sm text-red-500 font-medium">{errors.bio.message}</p>
                        )}
                        <p className="text-xs text-mutedforeground">
                            Maximum 500 characters
                        </p>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                {...register('phoneNumber')}
                                disabled={isLoading}
                                className={`pl-9 ${errors.phoneNumber ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                aria-invalid={errors.phoneNumber ? 'true' : 'false'}
                            />
                        </div>
                        {errors.phoneNumber && (
                            <p className="text-sm text-red-500 font-medium">{errors.phoneNumber.message}</p>
                        )}
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    id="city"
                                    type="text"
                                    placeholder="New York"
                                    {...register('city')}
                                    disabled={isLoading}
                                    className={`pl-9 ${errors.city ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    aria-invalid={errors.city ? 'true' : 'false'}
                                />
                            </div>
                            {errors.city && (
                                <p className="text-sm text-red-500 font-medium">{errors.city.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                type="text"
                                placeholder="United States"
                                {...register('country')}
                                disabled={isLoading}
                                className={errors.country ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                aria-invalid={errors.country ? 'true' : 'false'}
                            />
                            {errors.country && (
                                <p className="text-sm text-red-500 font-medium">{errors.country.message}</p>
                            )}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
