import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-middleware';
import { sendWelcomeEmail } from '@/lib/email';
import { hashToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const platform = searchParams.get('platform');

    if (!token) {
      console.log('❌ Email verification failed: No token provided');
      return apiError('Verification token is required', 400, 'MISSING_TOKEN');
    }

    // Find user with this verification token (hash incoming token to match stored hash)
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: hashToken(token),
        emailVerified: false,
      },
    });

    if (!user) {
      console.log('❌ Email verification failed: Invalid or expired token');
      return apiError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      console.log('❌ Email verification failed: Token expired');
      console.log(`   Expiry: ${user.verificationTokenExpiry.toISOString()}`);
      console.log(`   Current: ${new Date().toISOString()}`);
      return apiError('Verification token has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    // Generate auto-login token for iOS users
    // This one-time token lets the app skip the manual login step after verification
    let autoLoginToken: string | null = null;
    if (platform === 'ios') {
      autoLoginToken = crypto.randomBytes(32).toString('base64url');
    }

    // Update user to mark email as verified, clear verification token,
    // and optionally set auto-login token (stored hashed)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        ...(autoLoginToken && {
          autoLoginToken: hashToken(autoLoginToken),
          autoLoginTokenExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        }),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Email verified successfully');
      console.log(`   User: ${user.email} (${user.username})`);
      console.log(`   Platform: ${platform || 'web'}`);
    }

    // Send welcome email
    const username = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

    await sendWelcomeEmail(user.email, username);

    return apiResponse({
      success: true,
      message: 'Email verified successfully! You can now login.',
      ...(autoLoginToken && { autoLoginToken }),
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return apiError('Failed to verify email', 500, 'VERIFICATION_ERROR');
  }
}
