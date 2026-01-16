import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { apiResponse, apiError, setAuthCookie } from '@/lib/api-middleware';
import {
  validateUsername,
  isUsernameAvailable,
  normalizeUsername,
} from '@/lib/username-utils';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.issues[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email, username, password, firstName, lastName } = validation.data;

    // Validate username format
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return apiError(
        usernameValidation.error!,
        400,
        'INVALID_USERNAME'
      );
    }

    // Check if username is available (not reserved or taken)
    const available = await isUsernameAvailable(username);
    if (!available) {
      return apiError(
        'Username is taken or reserved',
        409,
        'USERNAME_TAKEN'
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return apiError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token with 30-minute expiry
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        verificationToken,
        verificationTokenExpiry,
        emailVerified: false,
        isActive: true,
        isAdmin: false,
        gpsPermission: 'not_asked',
        emailNotifications: true,
        twoFactorEnabled: false,
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

    // Send verification email (don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, verificationToken, username);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Generate JWT token
    const token = generateToken({
      ...user,
      bannerImage: user.bannerImage,
      gpsPermissionUpdated: user.gpsPermissionUpdated?.toISOString() || null,
      homeLocationUpdated: user.homeLocationUpdated?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
    }, false);

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

    // Delete existing sessions for this device type to prevent duplicates
    // This allows multi-device (web + iOS) but prevents multiple sessions from same device
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        deviceType: deviceType,
      },
    });

    // Create session record with full metadata
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: ipAddress,
        userAgent: userAgent,
        deviceType: deviceType,
        deviceName: deviceName,
        country: null, // Could be extracted from IP geolocation service
        loginMethod: 'registration',
        isActive: true,
      },
    });

    // Set auth cookie
    const response = apiResponse(
      {
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
      },
      201
    );

    setAuthCookie(response, token, 60 * 60 * 24 * 7); // 7 days

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return apiError('Failed to register user', 500, 'REGISTRATION_ERROR');
  }
}
