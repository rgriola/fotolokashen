import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-middleware';

/**
 * POST /api/auth/oauth/revoke
 * 
 * OAuth2 Token Revocation Endpoint
 * Revokes a refresh token (for logout)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, client_id } = body;

        // Validate required parameters
        if (!token || !client_id) {
            return apiError('Missing required parameters', 400, 'INVALID_REQUEST');
        }

        // Validate client exists
        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: client_id },
        });

        if (!client) {
            return apiError('Invalid client_id', 400, 'INVALID_CLIENT');
        }

        // Find refresh token
        const refreshToken = await prisma.oAuthRefreshToken.findUnique({
            where: { token },
        });

        // If token doesn't exist or already revoked, still return success (per OAuth2 spec)
        if (!refreshToken || refreshToken.revoked) {
            return apiResponse({ success: true });
        }

        // Validate client_id matches
        if (refreshToken.clientId !== client_id) {
            return apiError('Client mismatch', 400, 'INVALID_REQUEST');
        }

        // Revoke the token
        await prisma.oAuthRefreshToken.update({
            where: { token },
            data: {
                revoked: true,
                revokedAt: new Date(),
            },
        });

        // CRITICAL: Delete iOS and mobile-browser sessions for this user
        // Mobile-browser sessions are created during OAuth login flow (web-based auth)
        // iOS sessions are created when the app exchanges the authorization code
        // Leave web sessions active (user may be logged in on desktop)
        await prisma.session.deleteMany({
            where: { 
                userId: refreshToken.userId,
                deviceType: {
                    in: ['ios', 'mobile-browser-ios', 'mobile-browser-android']
                }
            },
        });

        return apiResponse({ success: true });

    } catch (error) {
        console.error('OAuth revoke error:', error);
        return apiError('Token revocation failed', 500, 'SERVER_ERROR');
    }
}
