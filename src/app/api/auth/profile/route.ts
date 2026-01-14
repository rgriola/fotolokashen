import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

// Validation schema with comprehensive rules
const updateProfileSchema = z.object({
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
    timezone: z.string()
        .max(50, 'Timezone must be less than 50 characters')
        .optional(),
    language: z.string()
        .max(10, 'Language code must be less than 10 characters')
        .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Language must be a valid language code (e.g., en, en-US)')
        .optional(),
    emailNotifications: z.boolean().optional(),
    gpsPermission: z.enum(['not_asked', 'granted', 'denied']).optional(),

    // Home Location
    homeLocationName: z.string().max(255).optional(),
    homeLocationLat: z.number().min(-90).max(90).optional(),
    homeLocationLng: z.number().min(-180).max(180).optional(),
});

/**
 * PATCH /api/auth/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await request.json();

        // Validate request body
        const validation = updateProfileSchema.safeParse(body);
        if (!validation.success) {
            return apiError(
                validation.error.issues[0].message,
                400,
                'VALIDATION_ERROR'
            );
        }

        // Update user profile
        const updateData: any = { ...validation.data };

        // If gpsPermission is being updated, also update the timestamp
        if (validation.data.gpsPermission !== undefined) {
            updateData.gpsPermissionUpdated = new Date();
        }

        // If home location is being updated, also update the timestamp
        if (validation.data.homeLocationLat !== undefined || validation.data.homeLocationLng !== undefined) {
            updateData.homeLocationUpdated = new Date();
        }

        const updatedUser = await prisma.user.update({
            where: { id: authResult.user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                bio: true,
                phoneNumber: true,
                city: true,
                country: true,
                timezone: true,
                language: true,
                emailNotifications: true,
                emailVerified: true,
                isActive: true,
                isAdmin: true,
                gpsPermission: true,
                gpsPermissionUpdated: true,
                homeLocationName: true,
                homeLocationLat: true,
                homeLocationLng: true,
                homeLocationUpdated: true,
                avatar: true,
                bannerImage: true,
                createdAt: true,
            },
        });

        return apiResponse({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                emailVerified: updatedUser.emailVerified,
                isActive: updatedUser.isActive,
                isAdmin: updatedUser.isAdmin,
                avatar: updatedUser.avatar,
                city: updatedUser.city,
                country: updatedUser.country,
                language: updatedUser.language,
                timezone: updatedUser.timezone,
                emailNotifications: updatedUser.emailNotifications,
                gpsPermission: updatedUser.gpsPermission,
                gpsPermissionUpdated: updatedUser.gpsPermissionUpdated?.toISOString() || null,
                homeLocationName: updatedUser.homeLocationName,
                homeLocationLat: updatedUser.homeLocationLat,
                homeLocationLng: updatedUser.homeLocationLng,
                homeLocationUpdated: updatedUser.homeLocationUpdated?.toISOString() || null,
                createdAt: updatedUser.createdAt.toISOString(),
            },
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        console.error('Update profile error:', error);
        return apiError('Failed to update profile', 500, 'SERVER_ERROR');
    }
}
