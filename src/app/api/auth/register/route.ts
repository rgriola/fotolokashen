import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken, generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { apiResponse, apiError, setAuthCookie } from '@/lib/api-middleware';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
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
        validation.error.errors[0].message,
        400,
        'VALIDATION_ERROR'
      );
    }

    const { email, username, password, firstName, lastName } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return apiError('Email already registered', 409, 'EMAIL_EXISTS');
      }
      return apiError('Username already taken', 409, 'USERNAME_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        verificationToken,
        emailVerified: false,
        isActive: true,
        isAdmin: false,
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
    const token = generateToken(user, false);

    // Create session record
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set auth cookie
    const response = apiResponse(
      {
        success: true,
        user,
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
