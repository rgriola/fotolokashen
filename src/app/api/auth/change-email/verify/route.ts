import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiResponse, apiError } from '@/lib/api-middleware';
import { sendEmailChangeConfirmation } from '@/lib/email';
import { logSecurityEvent, SecurityEventType } from '@/lib/security';
import prisma from '@/lib/prisma';

const verifyEmailChangeSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = verifyEmailChangeSchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                validation.error.issues[0].message,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { token } = validation.data;

        // Find the email change request
        const changeRequest = await prisma.emailChangeRequest.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!changeRequest) {
            return apiError('Invalid verification token', 400, 'INVALID_TOKEN');
        }

        // Check if already completed
        if (changeRequest.completedAt) {
            return apiError('Email change already completed', 400, 'ALREADY_COMPLETED');
        }

        // Check if cancelled
        if (changeRequest.cancelledAt) {
            return apiError('Email change was cancelled', 400, 'CANCELLED');
        }

        // Check if expired
        if (new Date() > changeRequest.expiresAt) {
            return apiError('Verification link has expired', 400, 'TOKEN_EXPIRED');
        }

        // Update user email
        await prisma.user.update({
            where: { id: changeRequest.userId },
            data: { email: changeRequest.newEmail },
        });

        // Mark request as completed
        await prisma.emailChangeRequest.update({
            where: { id: changeRequest.id },
            data: { completedAt: new Date() },
        });

        // Invalidate all sessions (force re-login)
        await prisma.session.deleteMany({
            where: { userId: changeRequest.userId },
        });

        // Send confirmation to BOTH emails
        await sendEmailChangeConfirmation(
            changeRequest.newEmail,
            changeRequest.user.username,
            'new'
        );

        await sendEmailChangeConfirmation(
            changeRequest.oldEmail,
            changeRequest.user.username,
            'old'
        );

        // Log the change
        await logSecurityEvent({
            userId: changeRequest.userId,
            eventType: SecurityEventType.EMAIL_CHANGE,
            request,
            success: true,
            metadata: {
                action: 'email_change_completed',
                oldEmail: changeRequest.oldEmail,
                newEmail: changeRequest.newEmail
            },
        });

        return apiResponse({
            success: true,
            message: 'Email changed successfully. Please log in with your new email.',
        });
    } catch (error: any) {
        console.error('Email change verification error:', error);
        return apiError('Failed to verify email change', 500, 'SERVER_ERROR');
    }
}
