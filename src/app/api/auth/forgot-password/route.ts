import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-middleware';
import { sendPasswordResetEmail } from '@/lib/email';
import { logSecurityEvent, SecurityEventType, getPasswordResetRequestCount } from '@/lib/security';
import crypto from 'crypto';

// Rate limiting constants
const MAX_RESET_REQUESTS_PER_HOUR = 5;
const TOKEN_EXPIRY_MINUTES = 15;

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email } = validation.data;

    // Check rate limiting for this email
    const resetRequestCount = await getPasswordResetRequestCount(email, 60);
    if (resetRequestCount >= MAX_RESET_REQUESTS_PER_HOUR) {
      // Log the rate limit event
      await logSecurityEvent({
        eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
        request,
        success: false,
        metadata: { email, reason: 'rate_limited' },
      });

      return apiError(
        'Too many password reset requests. Please try again later.',
        429,
        'RATE_LIMITED'
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        isActive: true,
      },
    });

    // Always return success message to prevent email enumeration
    // But only actually send email if user exists
    if (user) {
      // Don't send reset email if account is inactive
      if (!user.isActive) {
        await logSecurityEvent({
          userId: user.id,
          eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
          request,
          success: false,
          metadata: { email, reason: 'account_inactive' },
        });
      } else {
        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

        // Save token to database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry,
          },
        });

        // Send reset email
        const emailSent = await sendPasswordResetEmail(
          user.email,
          resetToken,
          user.username
        );

        // Log the event
        await logSecurityEvent({
          userId: user.id,
          eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
          request,
          success: emailSent,
          metadata: { email },
        });
      }
    } else {
      // Log attempt with non-existent email (potential reconnaissance)
      await logSecurityEvent({
        eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
        request,
        success: false,
        metadata: { email, reason: 'user_not_found' },
      });
    }

    // Generic success message regardless of whether user exists
    return apiResponse({
      success: true,
      message: 'If an account exists with that email, we\'ve sent password reset instructions.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return apiError('Failed to process password reset request', 500, 'SERVER_ERROR');
  }
}
