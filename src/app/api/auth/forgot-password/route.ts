import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generatePasswordResetToken, getResetTokenExpiry } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { apiResponse, apiError } from '@/lib/api-middleware';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
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
        validation.error.errors[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return apiResponse({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenExpiry = getResetTokenExpiry();

    // Store reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.username);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return apiError('Failed to send reset email', 500, 'EMAIL_ERROR');
    }

    return apiResponse({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return apiError('Failed to process request', 500, 'FORGOT_PASSWORD_ERROR');
  }
}
