import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

// Validation schema with comprehensive rules
const updateProfileSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .trim()
        .optional(),
    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .trim()
        .optional(),
    bio: z.string()
        .max(500, 'Bio must be less than 500 characters')
        .trim()
        .optional(),
    phoneNumber: z.string()
        .regex(/^[\d\s\-\+\(\)\.]+$/, 'Phone number can only contain numbers, spaces, and common phone symbols (+, -, (, ), .)')
        .min(10, 'Phone number must be at least 10 characters')
        .max(20, 'Phone number must be less than 20 characters')
        .transform(val => val.replace(/\s+/g, '')) // Remove whitespace
        .optional()
        .or(z.literal('')), // Allow empty string
    city: z.string()
        .max(100, 'City must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-'\.]+$/, 'City can only contain letters, spaces, hyphens, apostrophes, and periods')
        .trim()
        .optional(),
    country: z.string()
        .max(100, 'Country must be less than 100 characters')
        .regex(/^[a-zA-Z\s\-'\.]+$/, 'Country can only contain letters, spaces, hyphens, apostrophes, and periods')
        .trim()
        .optional(),
    timezone: z.string()
        .max(50, 'Timezone must be less than 50 characters')
        .optional(),
    language: z.string()
        .max(10, 'Language code must be less than 10 characters')
        .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Language must be a valid language code (e.g., en, en-US)')
        .optional(),
    emailNotifications: z.boolean().optional(),
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
        const updatedUser = await prisma.user.update({
            where: { id: authResult.user.id },
            data: validation.data,
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
                avatar: true,
                createdAt: true,
            },
        });

        return apiResponse({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        console.error('Update profile error:', error);
        return apiError('Failed to update profile', 500, 'SERVER_ERROR');
    }
}
