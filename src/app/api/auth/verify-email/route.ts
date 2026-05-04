import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-middleware';
import { sendWelcomeEmail } from '@/lib/email';
import { hashToken } from '@/lib/auth';

type VerificationUser = {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  verificationTokenExpiry: Date | null;
};

async function getUserByVerificationToken(token: string): Promise<VerificationUser | null> {
  return prisma.user.findFirst({
    where: {
      verificationToken: hashToken(token),
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      verificationTokenExpiry: true,
    },
  });
}

function isTokenExpired(expiry: Date | null): boolean {
  return !!expiry && expiry < new Date();
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return apiError('Verification token is required', 400, 'MISSING_TOKEN');
    }

    const user = await getUserByVerificationToken(token);

    if (!user) {
      return apiError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    if (user.emailVerified) {
      return apiResponse({
        success: true,
        alreadyVerified: true,
        canVerify: false,
        message: 'Email is already verified. You can login now.',
      });
    }

    if (isTokenExpired(user.verificationTokenExpiry)) {
      return apiError('Verification token has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    // Intentional side-effect free check: scanners and link previews can hit this route safely.
    return apiResponse({
      success: true,
      alreadyVerified: false,
      canVerify: true,
      message: 'Verification link is valid. Click confirm to finish email verification.',
    });
  } catch (error) {
    console.error('❌ Email verification validation error:', error);
    return apiError('Failed to validate verification link', 500, 'VERIFICATION_VALIDATION_ERROR');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token : null;
    const platform = typeof body?.platform === 'string' ? body.platform : null;

    if (!token) {
      return apiError('Verification token is required', 400, 'MISSING_TOKEN');
    }

    const user = await getUserByVerificationToken(token);

    if (!user) {
      return apiError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    if (user.emailVerified) {
      return apiResponse({
        success: true,
        alreadyVerified: true,
        message: 'Email is already verified. You can login now.',
      });
    }

    if (isTokenExpired(user.verificationTokenExpiry)) {
      return apiError('Verification token has expired. Please request a new one.', 400, 'TOKEN_EXPIRED');
    }

    let autoLoginToken: string | null = null;
    if (platform === 'ios') {
      autoLoginToken = crypto.randomBytes(32).toString('base64url');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        ...(autoLoginToken && {
          autoLoginToken: hashToken(autoLoginToken),
          autoLoginTokenExpiry: new Date(Date.now() + 5 * 60 * 1000),
        }),
      },
    });

    const username = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

    try {
      await sendWelcomeEmail(user.email, username);
    } catch (welcomeError) {
      // Verification must remain successful even if welcome email fails.
      console.error('⚠️ Failed to send welcome email after verification:', welcomeError);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Email verified successfully');
      console.log(`   User: ${user.email} (${user.username})`);
      console.log(`   Platform: ${platform || 'web'}`);
    }

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
