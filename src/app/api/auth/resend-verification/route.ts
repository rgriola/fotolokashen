import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-middleware';
import { generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

// Rate limiting: store last send times in memory (simple approach for now)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3; // Max 3 emails per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return apiError('Email is required', 400, 'VALIDATION_ERROR');
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Security: Always return success even if user doesn't exist
        // This prevents email enumeration attacks
        if (!user) {
            return apiResponse({ message: 'If that email exists, a verification link has been sent.' });
        }

        // Check if already verified
        if (user.emailVerified) {
            return apiResponse({ message: 'Email is already verified.' });
        }

        // Rate limiting check
        const now = Date.now();
        const userRateLimits = rateLimitMap.get(email) || [];
        
        // Remove timestamps older than the rate limit window
        const recentAttempts = userRateLimits.filter(
            timestamp => now - timestamp < RATE_LIMIT_WINDOW
        );

        if (recentAttempts.length >= RATE_LIMIT_MAX) {
            return apiError(
                `Too many verification emails sent. Please try again in ${Math.ceil((RATE_LIMIT_WINDOW - (now - recentAttempts[0])) / 60000)} minutes.`,
                429,
                'RATE_LIMIT_EXCEEDED'
            );
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email
        await sendVerificationEmail(user.email, user.username, verificationToken);

        // Update rate limit
        recentAttempts.push(now);
        rateLimitMap.set(email, recentAttempts);

        return apiResponse({
            message: 'Verification email sent successfully. Please check your inbox.',
        });
    } catch (error: any) {
        console.error('Error resending verification email:', error);
        return apiError('Failed to resend verification email', 500, 'RESEND_ERROR');
    }
}
