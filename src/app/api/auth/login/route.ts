import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { comparePassword, generateToken } from  '@/lib/auth';
import { apiResponse, apiError, setAuthCookie } from '@/lib/api-middleware';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

/**
 * POST /api/auth/login
 * Login existing user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        validation.error.errors[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email, password, rememberMe } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
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
        createdAt: user.createdAt,
      },
      rememberMe || false
    );

    // Single-session enforcement: Delete all existing sessions for this user
    // This ensures only one active session per user at a time
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

        // Create session record
    const expiryDays = rememberMe ? 30 : 7;
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
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
        createdAt: user.createdAt,
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
