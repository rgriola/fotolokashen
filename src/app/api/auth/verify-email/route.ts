import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      console.log('❌ Email verification failed: No token provided');
      return apiError('Verification token is required', 400, 'MISSING_TOKEN');
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        emailVerified: false,
      },
    });

    if (!user) {
      console.log('❌ Email verification failed: Invalid or expired token');
      return apiError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    // Update user to mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    // Log successful verification
    console.log('✅ Email verified successfully');
    console.log(`   User: ${user.email} (${user.username})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    return apiResponse({
      success: true,
      message: 'Email verified successfully! You can now login.',
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return apiError('Failed to verify email', 500, 'VERIFICATION_ERROR');
  }
}
