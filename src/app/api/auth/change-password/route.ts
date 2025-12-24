import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { comparePassword, hashPassword } from '@/lib/auth';
import { sendPasswordChangedEmail } from '@/lib/email';
import { logSecurityEvent, SecurityEventType, getClientIP } from '@/lib/security';
import prisma from '@/lib/prisma';

// Validation schema
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .max(255, 'Password is too long'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ['newPassword'],
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await request.json();

        // Validate request body
        const validation = changePasswordSchema.safeParse(body);
        if (!validation.success) {
            return apiError(
                validation.error.issues[0].message,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { currentPassword, newPassword } = validation.data;

        // Get full user data with password hash
        const fullUser = await prisma.user.findUnique({
            where: { id: authResult.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
            },
        });

        if (!fullUser) {
            return apiError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Verify current password
        const passwordValid = await comparePassword(currentPassword, fullUser.passwordHash);
        if (!passwordValid) {
            await logSecurityEvent({
                userId: authResult.user.id,
                eventType: SecurityEventType.PASSWORD_CHANGE,
                request,
                success: false,
                metadata: { reason: 'incorrect_current_password' },
            });

            return apiError('Current password is incorrect', 401, 'INVALID_PASSWORD');
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password and reset any lockout status
        await prisma.user.update({
            where: { id: authResult.user.id },
            data: {
                passwordHash: newPasswordHash,
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });

        // Invalidate all existing sessions (force re-login everywhere)
        await prisma.session.deleteMany({
            where: { userId: authResult.user.id },
        });

        // Send notification email
        const ipAddress = getClientIP(request);
        await sendPasswordChangedEmail(
            fullUser.email,
            fullUser.username,
            ipAddress,
            new Date()
        );

        // Log successful password change
        await logSecurityEvent({
            userId: authResult.user.id,
            eventType: SecurityEventType.PASSWORD_CHANGE,
            request,
            success: true,
            metadata: { email: fullUser.email },
        });

        return apiResponse({
            success: true,
            message: 'Password changed successfully. Please log in again.',
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        console.error('Change password error:', error);
        return apiError('Failed to change password', 500, 'SERVER_ERROR');
    }
}
