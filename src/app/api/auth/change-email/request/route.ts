import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { comparePassword } from '@/lib/auth';
import { sendEmailChangeVerification, sendEmailChangeAlert } from '@/lib/email';
import { logSecurityEvent, SecurityEventType, getClientIP } from '@/lib/security';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// STRICT RATE LIMITING
const MAX_EMAIL_CHANGES_PER_DAY = 1;
const MAX_EMAIL_CHANGES_PER_YEAR = 5;

// Email validation schema
const changeEmailSchema = z.object({
    newEmail: z.string()
        .email('Please enter a valid email address')
        .toLowerCase()
        .trim()
        .max(255, 'Email address is too long'),
    currentPassword: z.string().min(1, 'Current password is required'),
});

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const body = await request.json();

        // BACKEND VALIDATION
        const validation = changeEmailSchema.safeParse(body);
        if (!validation.success) {
            return apiError(
                validation.error.issues[0].message,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { newEmail, currentPassword } = validation.data;

        // Get full user data
        const user = await prisma.user.findUnique({
            where: { id: authResult.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
            },
        });

        if (!user) {
            return apiError('User not found', 404, 'USER_NOT_FOUND');
        }

        // Check if new email is same as current
        if (newEmail === user.email) {
            return apiError(
                'New email address is the same as your current email',
                400,
                'SAME_EMAIL'
            );
        }

        // CHECK IF EMAIL ALREADY EXISTS - SPECIFIC ERROR
        const emailTaken = await prisma.user.findUnique({
            where: { email: newEmail },
        });

        if (emailTaken) {
            return apiError(
                'This email address is already registered to another account',
                409,
                'EMAIL_ALREADY_EXISTS'
            );
        }

        // Verify current password
        const passwordValid = await comparePassword(currentPassword, user.passwordHash);
        if (!passwordValid) {
            await logSecurityEvent({
                userId: user.id,
                eventType: SecurityEventType.EMAIL_CHANGE,
                request,
                success: false,
                metadata: { reason: 'incorrect_password_for_email_change' },
            });
            return apiError(
                'Current password is incorrect',
                401,
                'INVALID_PASSWORD'
            );
        }

        // STRICT RATE LIMITING - 1 PER 24 HOURS
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentRequests = await prisma.emailChangeRequest.count({
            where: {
                userId: user.id,
                createdAt: { gte: oneDayAgo },
            },
        });

        if (recentRequests >= MAX_EMAIL_CHANGES_PER_DAY) {
            await logSecurityEvent({
                userId: user.id,
                eventType: SecurityEventType.EMAIL_CHANGE,
                request,
                success: false,
                metadata: { reason: 'email_change_rate_limited_daily' },
            });
            return apiError(
                'You can only change your email once per 24 hours. Please try again tomorrow.',
                429,
                'RATE_LIMITED_DAILY'
            );
        }

        // STRICT RATE LIMITING - 5 PER YEAR
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const yearlyRequests = await prisma.emailChangeRequest.count({
            where: {
                userId: user.id,
                createdAt: { gte: oneYearAgo },
                completedAt: { not: null }, // Only count completed changes
            },
        });

        if (yearlyRequests >= MAX_EMAIL_CHANGES_PER_YEAR) {
            await logSecurityEvent({
                userId: user.id,
                eventType: SecurityEventType.EMAIL_CHANGE,
                request,
                success: false,
                metadata: {
                    reason: 'email_change_rate_limited_yearly',
                    yearlyCount: yearlyRequests
                },
            });
            return apiError(
                'You have reached the maximum of 5 email changes per year. Please contact support if you need assistance.',
                429,
                'RATE_LIMITED_YEARLY'
            );
        }

        // Cancel any pending email change requests
        await prisma.emailChangeRequest.updateMany({
            where: {
                userId: user.id,
                completedAt: null,
                cancelledAt: null,
            },
            data: {
                cancelledAt: new Date(),
            },
        });

        // Generate tokens
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const cancelToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Create email change request
        const ipAddress = getClientIP(request);
        const userAgent = request.headers.get('user-agent');

        await prisma.emailChangeRequest.create({
            data: {
                userId: user.id,
                oldEmail: user.email,
                newEmail,
                token: verificationToken,
                cancelToken,
                expiresAt,
                ipAddress,
                userAgent,
            },
        });

        // Send verification email to NEW email
        await sendEmailChangeVerification(
            newEmail,
            user.username,
            verificationToken,
            user.email
        );

        // Send alert to OLD email with cancel option
        await sendEmailChangeAlert(
            user.email,
            user.username,
            newEmail,
            cancelToken,
            ipAddress
        );

        // Log the request
        await logSecurityEvent({
            userId: user.id,
            eventType: SecurityEventType.EMAIL_CHANGE,
            request,
            success: true,
            metadata: {
                action: 'email_change_requested',
                oldEmail: user.email,
                newEmail,
                yearlyCount: yearlyRequests + 1
            },
        });

        return apiResponse({
            success: true,
            message: 'Verification email sent. Please check your new email address to confirm the change.',
        });
    } catch (error: any) {
        console.error('Email change request error:', error);
        return apiError('Failed to process email change request', 500, 'SERVER_ERROR');
    }
}
