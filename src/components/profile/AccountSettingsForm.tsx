'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
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
    const [hasChanges, setHasChanges] = useState(false);
    const [changes, setChanges] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<AccountSettingsFormData>({
        resolver: zodResolver(accountSettingsSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            bio: '',
            phoneNumber: '',
            city: '',
            country: '',
        },
    });

    // Watch individual fields to avoid object reference issues
    const firstName = watch('firstName');
    const lastName = watch('lastName');
    const bio = watch('bio');
    const phoneNumber = watch('phoneNumber');
    const city = watch('city');
    const country = watch('country');

    // Track changes
    useEffect(() => {
        if (!user || !isDirty) {
            setHasChanges(false);
            setChanges([]);
            return;
        }

        const changedFields: string[] = [];
        const userBio = (user as { bio?: string }).bio || '';
        const userPhone = (user as { phoneNumber?: string }).phoneNumber || '';
        const userCity = (user as { city?: string }).city || '';
        const userCountry = (user as { country?: string }).country || '';

        if (firstName !== (user.firstName || '')) {
            changedFields.push(`First Name: ${firstName || '(empty)'}`);
        }
        if (lastName !== (user.lastName || '')) {
            changedFields.push(`Last Name: ${lastName || '(empty)'}`);
        }
        if (bio !== userBio) {
            changedFields.push(`Bio: ${bio ? 'Updated' : 'Cleared'}`);
        }
        if (phoneNumber !== userPhone) {
            changedFields.push(`Phone: ${phoneNumber || '(empty)'}`);
        }
        if (city !== userCity) {
            changedFields.push(`City: ${city || '(empty)'}`);
        }
        if (country !== userCountry) {
            changedFields.push(`Country: ${country || '(empty)'}`);
        }

        setChanges(changedFields);
        setHasChanges(changedFields.length > 0);
    }, [firstName, lastName, bio, phoneNumber, city, country, user, isDirty]);

    // Update form when user data is loaded
    useEffect(() => {
        if (user) {
            const userBio = (user as { bio?: string }).bio || '';
            const userPhone = (user as { phoneNumber?: string }).phoneNumber || '';
            const userCity = (user as { city?: string }).city || '';
            const userCountry = (user as { country?: string }).country || '';
            
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                bio: userBio,
                phoneNumber: userPhone,
                city: userCity,
                country: userCountry,
            });
        }
    }, [user, reset]);

    const handleDiscard = () => {
        if (user) {
            const userBio = (user as { bio?: string }).bio || '';
            const userPhone = (user as { phoneNumber?: string }).phoneNumber || '';
            const userCity = (user as { city?: string }).city || '';
            const userCountry = (user as { country?: string }).country || '';
            
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                bio: userBio,
                phoneNumber: userPhone,
                city: userCity,
                country: userCountry,
            });
            toast.info('Changes discarded');
        }
    };

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
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Account Information
                    </CardTitle>
                </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Email and Username (Read-only) - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                Email cannot be changed
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
                                Username cannot be changed
                            </p>
                        </div>
                    </div>

                    {/* First Name and Last Name - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </form>
            </CardContent>
        </Card>

        {/* Unsaved Changes Banner */}
        {hasChanges && (
            <div className="fixed bottom-0 left-0 right-0 bg-amber-50 dark:bg-amber-950/20 border-t-2 border-amber-500 p-3 sm:p-4 shadow-lg z-50 animate-in slide-in-from-bottom">
                <div className="container max-w-6xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                                <p className="font-semibold text-sm sm:text-base text-amber-900 dark:text-amber-100">
                                    Unsaved changes
                                </p>
                            </div>
                            <ul className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-6 sm:ml-0">
                                {changes.slice(0, 3).map((change, i) => (
                                    <li key={i} className="truncate">• {change}</li>
                                ))}
                                {changes.length > 3 && (
                                    <li className="text-amber-700 dark:text-amber-300">
                                        +{changes.length - 3} more...
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="flex gap-2 sm:gap-2 sm:flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDiscard}
                                disabled={isLoading}
                                className="flex-1 sm:flex-initial border-amber-300 dark:border-amber-700 text-xs sm:text-sm h-9"
                            >
                                Discard
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSubmit(onSubmit)}
                                disabled={isLoading}
                                className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-9"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
    );
}
