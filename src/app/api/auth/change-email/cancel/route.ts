import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiResponse, apiError } from '@/lib/api-middleware';
import { logSecurityEvent, SecurityEventType } from '@/lib/security';
import prisma from '@/lib/prisma';

const cancelEmailChangeSchema = z.object({
    cancelToken: z.string().min(1, 'Cancel token is required'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = cancelEmailChangeSchema.safeParse(body);

        if (!validation.success) {
            return apiError(
                validation.error.issues[0].message,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { cancelToken } = validation.data;

        // Find the email change request
        const changeRequest = await prisma.emailChangeRequest.findUnique({
            where: { cancelToken },
        });

        if (!changeRequest) {
            return apiError('Invalid cancel token', 400, 'INVALID_TOKEN');
        }

        // Check if already completed
        if (changeRequest.completedAt) {
            return apiError('Email change already completed', 400, 'ALREADY_COMPLETED');
        }

        // Check if already cancelled
        if (changeRequest.cancelledAt) {
            return apiError('Email change already cancelled', 400, 'ALREADY_CANCELLED');
        }

        // Cancel the request
        await prisma.emailChangeRequest.update({
            where: { id: changeRequest.id },
            data: { cancelledAt: new Date() },
        });

        // Log the cancellation
        await logSecurityEvent({
            userId: changeRequest.userId,
            eventType: SecurityEventType.EMAIL_CHANGE,
            request,
            success: true,
            metadata: {
                action: 'email_change_cancelled',
                oldEmail: changeRequest.oldEmail,
                newEmail: changeRequest.newEmail
            },
        });

        return apiResponse({
            success: true,
            message: 'Email change cancelled successfully.',
        });
    } catch (error: any) {
        console.error('Email change cancellation error:', error);
        return apiError('Failed to cancel email change', 500, 'SERVER_ERROR');
    }
}
