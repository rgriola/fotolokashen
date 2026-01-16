import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { apiResponse, apiError, setAuthCookie } from '@/lib/api-middleware';
import { sendPasswordChangedEmail } from '@/lib/email';
import { logSecurityEvent, SecurityEventType, getClientIP, getPasswordResetAttemptCount } from '@/lib/security';

// Rate limiting constants
const MAX_RESET_ATTEMPTS_PER_15_MIN = 2;  // 2 successful resets in 15 minutes
const MAX_RESET_ATTEMPTS_PER_HOUR = 3;    // 3 successful resets in 1 hour

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
        bannerImage: true,
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

    // Check rate limiting - prevent too many password resets
    const recentResets = await getPasswordResetAttemptCount(user.email, 15);
    if (recentResets >= MAX_RESET_ATTEMPTS_PER_15_MIN) {
      await logSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_RESET_SUCCESS,
        request,
        success: false,
        metadata: { email: user.email, reason: 'rate_limited_15min' },
      });

      return apiError(
        'Too many password reset attempts. Please wait 15 minutes before trying again.',
        429,
        'RATE_LIMITED'
      );
    }

    const hourlyResets = await getPasswordResetAttemptCount(user.email, 60);
    if (hourlyResets >= MAX_RESET_ATTEMPTS_PER_HOUR) {
      await logSecurityEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_RESET_SUCCESS,
        request,
        success: false,
        metadata: { email: user.email, reason: 'rate_limited_1hour' },
      });

      return apiError(
        'Too many password reset attempts. Please wait 1 hour before trying again.',
        429,
        'RATE_LIMITED'
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

    // Check if email is verified before auto-login
    if (!user.emailVerified) {
      // Email not verified - require verification before login
      return apiResponse({
        success: true,
        message: 'Password reset successful. Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Email is verified - proceed with auto-login
    // Generate JWT token for the user
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
        bannerImage: user.bannerImage,
        city: user.city,
        country: user.country,
        language: user.language,
        timezone: user.timezone,
        emailNotifications: user.emailNotifications,
        gpsPermission: user.gpsPermission,
        gpsPermissionUpdated: user.gpsPermissionUpdated?.toISOString() || null,
        homeLocationName: user.homeLocationName,
        homeLocationLat: user.homeLocationLat,
        homeLocationLng: user.homeLocationLng,
        homeLocationUpdated: user.homeLocationUpdated?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
      },
      false // Don't use "remember me" for auto-login after password reset
    );

    // Create new session
    const expiryDays = 7; // Default session length
    
    // Extract session metadata
    const sessionIpAddress = request.headers.get('x-forwarded-for') || 
                             request.headers.get('x-real-ip') || 
                             'unknown';
    const sessionUserAgent = request.headers.get('user-agent') || 'unknown';
    
    // Detect device type from user agent
    const ua = sessionUserAgent.toLowerCase();
    let deviceType = 'web';
    if (ua.includes('iphone') || ua.includes('ipad')) {
      deviceType = 'mobile-browser-ios';
    } else if (ua.includes('android')) {
      deviceType = 'mobile-browser-android';
    } else if (ua.includes('mobile')) {
      deviceType = 'mobile-browser';
    }
    
    // Extract device name from user agent (simplified)
    const deviceName = sessionUserAgent.split('(')[1]?.split(')')[0] || null;
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token: jwtToken,
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
        ipAddress: sessionIpAddress,
        userAgent: sessionUserAgent,
        deviceType: deviceType,
        deviceName: deviceName,
        country: null,
        loginMethod: 'password_reset',
        isActive: true,
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
        gpsPermissionUpdated: user.gpsPermissionUpdated?.toISOString() || null,
        homeLocationName: user.homeLocationName,
        homeLocationLat: user.homeLocationLat,
        homeLocationLng: user.homeLocationLng,
        homeLocationUpdated: user.homeLocationUpdated?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
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
