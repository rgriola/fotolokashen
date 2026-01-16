import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { comparePassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { apiResponse, apiError, setAuthCookie } from '@/lib/api-middleware';
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';

// Rate limiting constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// Validation schema for login with enhanced security
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()  // Normalize email
    .trim(),        // Remove whitespace
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password is too long'),  // Prevent DOS attacks with huge passwords
  rememberMe: z.boolean().optional(),
});

/**
 * POST /api/auth/login
 * Login existing user with rate limiting and account lockout
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting BEFORE any database queries
    const rateLimitResult = rateLimit(request, {
      ...RateLimitPresets.MODERATE,  // 10 requests per 15 minutes
      keyPrefix: 'login',
    });

    if (!rateLimitResult.allowed) {
      const response = apiError(
        `Too many login attempts. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
      addRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    const body = await request.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email, password, rememberMe } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        verificationToken: true,
        verificationTokenExpiry: true,
        lastVerificationEmailSent: true,
        isActive: true,
        isAdmin: true,
        passwordHash: true,
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
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      // Use generic error message to prevent email enumeration
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return apiError(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        429,
        'ACCOUNT_LOCKED'
      );
    }

    // If lock period has expired, reset the failed attempts
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Check if email is verified BEFORE checking password
    // This prevents enumeration while providing helpful UX
    if (!user.emailVerified) {
      // Check if verification token exists and is expired
      const tokenExpired = !user.verificationTokenExpiry || 
                           user.verificationTokenExpiry < new Date();
      
      // Check rate limiting for verification emails (max 1 per 5 minutes)
      const lastSent = user.lastVerificationEmailSent;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const canResend = !lastSent || lastSent < fiveMinutesAgo;
      
      if (tokenExpired && canResend) {
        // Generate new token (30 min expiry)
        const newToken = generateVerificationToken();
        const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
        
        // Update user in database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationToken: newToken,
            verificationTokenExpiry: newExpiry,
            lastVerificationEmailSent: new Date(),
          },
        });
        
        // Send new verification email
        await sendVerificationEmail(user.email, newToken, user.username);
        
        return NextResponse.json(
          {
            error: 'Email not verified. A new verification link has been sent to your email.',
            code: 'EMAIL_NOT_VERIFIED_RESENT',
            requiresVerification: true,
            email: user.email,
            tokenResent: true,
          },
          { status: 403 }
        );
      } else if (tokenExpired && !canResend) {
        // Token expired but rate limited
        const retryAfter = lastSent 
          ? Math.ceil((lastSent.getTime() - fiveMinutesAgo.getTime()) / 1000)
          : 0;
        
        return NextResponse.json(
          {
            error: `Verification email was sent recently. Please check your inbox or try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
            code: 'EMAIL_RATE_LIMITED',
            requiresVerification: true,
            email: user.email,
            retryAfter,
          },
          { status: 429 }
        );
      } else {
        // Token still valid
        return NextResponse.json(
          {
            error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
            code: 'EMAIL_NOT_VERIFIED',
            requiresVerification: true,
            email: user.email,
            tokenResent: false,
          },
          { status: 403 }
        );
      }
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedUntil: lockUntil,
          },
        });

        return apiError(
          `Account locked due to ${MAX_FAILED_ATTEMPTS} failed login attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
          429,
          'ACCOUNT_LOCKED'
        );
      }

      // Update failed attempts count
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
        },
      });

      const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      return apiError(
        `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before account lockout.`,
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Password is valid - reset failed login attempts
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return apiError(
        'Please verify your email before logging in. Check your inbox for the verification link.',
        403,
        'EMAIL_NOT_VERIFIED'
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return apiError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Generate JWT token
    const token = generateToken(
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
      rememberMe || false
    );

    // Single-session enforcement: Delete all existing sessions for this user
    // This ensures only one active session per user at a time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // REMOVED: Don't delete all sessions - allow multiple devices
    // Users should be able to be logged in on web + mobile simultaneously
    // await prisma.session.deleteMany({
    //   where: { userId: user.id },
    // });

    // Extract session metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Detect device type from user agent
    const ua = userAgent.toLowerCase();
    let deviceType = 'web';
    if (ua.includes('iphone') || ua.includes('ipad')) {
      deviceType = 'mobile-browser-ios';
    } else if (ua.includes('android')) {
      deviceType = 'mobile-browser-android';
    } else if (ua.includes('mobile')) {
      deviceType = 'mobile-browser';
    }
    
    // Extract device name from user agent (simplified)
    const deviceName = userAgent.split('(')[1]?.split(')')[0] || null;

    // Create session record with full metadata
    const expiryDays = rememberMe ? 30 : 7;
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
        ipAddress: ipAddress,
        userAgent: userAgent,
        deviceType: deviceType,
        deviceName: deviceName,
        country: null, // Could be extracted from IP geolocation service
        loginMethod: 'email_password',
        isActive: true,
      },
    });

    // Prepare response
    const response = apiResponse({
      success: true,
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
      token,
      requiresVerification: !user.emailVerified,
    });

    // Set auth cookie
    setAuthCookie(response, token, 60 * 60 * 24 * expiryDays);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Failed to login', 500, 'LOGIN_ERROR');
  }
}
