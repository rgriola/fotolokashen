import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { apiResponse, apiError, setAuthCookie } from '@/lib/api-middleware';
import { sendPasswordChangedEmail } from '@/lib/email';
import { logSecurityEvent, SecurityEventType, getClientIP } from '@/lib/security';

// Validation schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .max(255, 'Password is too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    //validate request body
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { token, password } = validation.data;

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        isActive: true,
        isAdmin: true,
        avatar: true,
        city: true,
        country: true,
        language: true,
        timezone: true,
        emailNotifications: true,
        gpsPermission: true,
        gpsPermissionUpdated: true,
        homeLocationName: true,
        homeLocationLat: true,
        homeLocationLng: true,
        homeLocationUpdated: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Log failed attempt
      await logSecurityEvent({
        eventType: SecurityEventType.PASSWORD_RESET_SUCCESS,
        request,
        success: false,
        metadata: { reason: 'invalid_or_expired_token' },
      });

      return apiError(
        'Invalid or expired reset token. Please request a new password reset.',
        400,
        'INVALID_TOKEN'
      );
    }

    // Check if account is active
    if (!user.isActive) {
      await logSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_RESET_SUCCESS,
        request,
        success: false,
        metadata: { reason: 'account_inactive' },
      });

      return apiError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    // Also reset failed login attempts and unlock account if locked
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Invalidate all existing sessions (force re-login everywhere)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Send notification email
    const ipAddress = getClientIP(request);
    await sendPasswordChangedEmail(
      user.email,
      user.username,
      ipAddress,
      new Date()
    );

    // Log successful password reset
    await logSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.PASSWORD_RESET_SUCCESS,
      request,
      success: true,
      metadata: { email: user.email },
    });

    // Auto-login: Generate JWT token for the user
    // We construct the PublicUser object manually here since we have all the fields
    const jwtToken = generateToken(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        city: user.city,
        country: user.country,
        language: user.language,
        timezone: user.timezone,
        emailNotifications: user.emailNotifications,
        gpsPermission: user.gpsPermission,
        gpsPermissionUpdated: user.gpsPermissionUpdated,
        homeLocationName: user.homeLocationName,
        homeLocationLat: user.homeLocationLat,
        homeLocationLng: user.homeLocationLng,
        homeLocationUpdated: user.homeLocationUpdated,
        createdAt: user.createdAt,
      },
      false // Don't use "remember me" for auto-login after password reset
    );

    // Create new session
    const expiryDays = 7; // Default session length
    await prisma.session.create({
      data: {
        userId: user.id,
        token: jwtToken,
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
      },
    });

    // Log the new login
    await logSecurityEvent({
      userId: user.id,
      eventType: SecurityEventType.LOGIN,
      request,
      success: true,
      metadata: { method: 'password_reset_auto_login' },
    });

    // Prepare response
    const response = apiResponse({
      success: true,
      message: 'Password reset successful. You are now logged in.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        city: user.city,
        country: user.country,
        language: user.language,
        timezone: user.timezone,
        emailNotifications: user.emailNotifications,
        gpsPermission: user.gpsPermission,
        gpsPermissionUpdated: user.gpsPermissionUpdated,
        homeLocationName: user.homeLocationName,
        homeLocationLat: user.homeLocationLat,
        homeLocationLng: user.homeLocationLng,
        homeLocationUpdated: user.homeLocationUpdated,
        createdAt: user.createdAt,
      },
      token: jwtToken,
    });

    // Set auth cookie
    setAuthCookie(response, jwtToken, 60 * 60 * 24 * expiryDays);

    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    return apiError('Failed to reset password', 500, 'SERVER_ERROR');
  }
}
