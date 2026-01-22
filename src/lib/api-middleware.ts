import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import prisma from './prisma';
import type { PublicUser } from '@/types/user';

/**
 * Standardized API response format
 */
export function apiResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status });
}

/**
 * Serialize user object by converting Date objects to ISO strings
 */
export function serializeUser(user: any): PublicUser {
    return {
        ...user,
        gpsPermissionUpdated: user.gpsPermissionUpdated?.toISOString() || null,
        homeLocationUpdated: user.homeLocationUpdated?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
    };
}

/**
 * Standardized API error response
 */
export function apiError(message: string, status: number = 500, code?: string) {
    return NextResponse.json(
        {
            error: message,
            code: code || `ERROR_${status}`,
        },
        { status }
    );
}

/**
 * Extract JWT token from request cookies or Authorization header
 */
function extractToken(request: NextRequest): string | null {
    // Try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Try to get from cookies
    const token = request.cookies.get('auth_token')?.value;
    return token || null;
}

/**
 * Middleware to require authentication for API routes
 * Verifies JWT token and attaches user data to request
 */
export async function requireAuth(request: NextRequest): Promise<{
    authorized: boolean;
    user?: PublicUser;
    error?: string;
}> {
    const token = extractToken(request);
    console.log('[requireAuth] Token extracted:', token ? 'YES' : 'NO');

    if (!token) {
        return {
            authorized: false,
            error: 'No token provided',
        };
    }

    const decoded = verifyToken(token);
    console.log('[requireAuth] Token decoded:', decoded ? 'YES' : 'NO');
    if (!decoded) {
        return {
            authorized: false,
            error: 'Invalid or expired token',
        };
    }

    // CRITICAL SECURITY: Validate that session exists in database
    try {
        const session = await prisma.session.findFirst({
            where: {
                token: token,
                expiresAt: { gte: new Date() }, // Session not expired
            },
        });

        if (!session) {
            console.log('[requireAuth] No valid session found for token');
            return {
                authorized: false,
                error: 'Session expired or invalid',
            };
        }

        console.log('[requireAuth] Session validated for user:', decoded.userId);
    } catch (error) {
        console.error('[requireAuth] Session validation error:', error);
        return {
            authorized: false,
            error: 'Session validation failed',
        };
    }

    // Fetch user from database to ensure they still exist and are active
    try {
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                emailVerified: true,
                isActive: true,
                isAdmin: true,
                role: true,
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
            console.log('[requireAuth] User not found in database');
            return {
                authorized: false,
                error: 'User not found',
            };
        }
        console.log('[requireAuth] User found:', user.email);

        if (!user.isActive) {
            return {
                authorized: false,
                error: 'Account is deactivated',
            };
        }

        return {
            authorized: true,
            user: serializeUser(user),
        };
    } catch (error) {
        console.error('Error fetching user in requireAuth:', error);
        return {
            authorized: false,
            error: 'Authentication failed',
        };
    }
}

/**
 * Get authenticated user from request
 * Returns user data if authenticated, null otherwise
 */
export async function getAuthUser(
    request: NextRequest
): Promise<PublicUser | null> {
    const result = await requireAuth(request);
    return result.authorized && result.user ? result.user : null;
}

/**
 * Require admin access
 */
export async function requireAdmin(request: NextRequest): Promise<{
    authorized: boolean;
    user?: PublicUser;
    error?: string;
}> {
    const authResult = await requireAuth(request);

    if (!authResult.authorized) {
        return authResult;
    }

    if (!authResult.user?.isAdmin) {
        return {
            authorized: false,
            error: 'Admin access required',
        };
    }

    return authResult;
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(response: NextResponse, token: string, maxAge?: number) {
    response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: maxAge || 60 * 60 * 24 * 7, // 7 days default
        path: '/',
    });
    return response;
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(response: NextResponse) {
    response.cookies.set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}
