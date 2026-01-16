import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, serializeUser } from '@/lib/api-middleware';
import { generateToken } from '@/lib/auth';

/**
 * POST /api/auth/oauth/token
 * 
 * OAuth2 Token Endpoint
 * Exchanges authorization code for access token or refreshes existing token
 * 
 * Grant types supported:
 * - authorization_code: Exchange code for tokens
 * - refresh_token: Get new access token using refresh token
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { grant_type, client_id } = body;

        // Validate required parameters
        if (!grant_type || !client_id) {
            return apiError('Missing required parameters', 400, 'INVALID_REQUEST');
        }

        // Validate client exists
        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: client_id },
        });

        if (!client) {
            return apiError('Invalid client_id', 400, 'INVALID_CLIENT');
        }

        // Handle different grant types
        if (grant_type === 'authorization_code') {
            return handleAuthorizationCodeGrant(body, client);
        } else if (grant_type === 'refresh_token') {
            return handleRefreshTokenGrant(body, client, request);
        } else {
            return apiError('Unsupported grant_type', 400, 'UNSUPPORTED_GRANT_TYPE');
        }

    } catch (error) {
        console.error('OAuth token error:', error);
        return apiError('Token exchange failed', 500, 'SERVER_ERROR');
    }
}

/**
 * Handle authorization_code grant type
 */
async function handleAuthorizationCodeGrant(body: any, client: any) {
    const { code, code_verifier, redirect_uri } = body;

    // Validate required parameters
    if (!code || !code_verifier || !redirect_uri) {
        return apiError('Missing required parameters for authorization_code grant', 400, 'INVALID_REQUEST');
    }

    // Find authorization code
    const authCode = await prisma.oAuthAuthorizationCode.findUnique({
        where: { code },
        include: { user: true },
    });

    if (!authCode) {
        return apiError('Invalid authorization code', 400, 'INVALID_GRANT');
    }

    // Validate code hasn't been used
    if (authCode.used) {
        return apiError('Authorization code already used', 400, 'INVALID_GRANT');
    }

    // Validate code hasn't expired
    if (new Date() > authCode.expiresAt) {
        return apiError('Authorization code expired', 400, 'INVALID_GRANT');
    }

    // Validate client_id matches
    if (authCode.clientId !== client.clientId) {
        return apiError('Client mismatch', 400, 'INVALID_GRANT');
    }

    // Validate redirect_uri matches
    if (authCode.redirectUri !== redirect_uri) {
        return apiError('Redirect URI mismatch', 400, 'INVALID_GRANT');
    }

    // Validate PKCE code_verifier
    const codeChallenge = crypto
        .createHash('sha256')
        .update(code_verifier)
        .digest('base64url');

    if (codeChallenge !== authCode.codeChallenge) {
        return apiError('Invalid code_verifier', 400, 'INVALID_GRANT');
    }

    // Mark code as used
    await prisma.oAuthAuthorizationCode.update({
        where: { code },
        data: {
            used: true,
            usedAt: new Date(),
        },
    });

    // Generate access token (JWT)
    const user = serializeUser(authCode.user);
    const accessToken = generateToken(user, false);

    // Create session in database for token validation
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 1); // 24 hours (matches JWT expiry)

    await prisma.session.create({
        data: {
            token: accessToken,
            userId: authCode.userId,
            expiresAt: sessionExpiresAt,
            deviceType: 'ios',
        },
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('base64url');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

    // Store refresh token
    await prisma.oAuthRefreshToken.create({
        data: {
            token: refreshToken,
            clientId: client.clientId,
            userId: authCode.userId,
            scopes: authCode.scopes,
            expiresAt: refreshExpiresAt,
            deviceType: 'ios', // Could be extracted from user agent
        },
    });

    // Return tokens
    return apiResponse({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 86400, // 24 hours
        scope: authCode.scopes.join(' '),
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
        },
    });
}

/**
 * Handle refresh_token grant type
 */
async function handleRefreshTokenGrant(body: any, client: any, request: NextRequest) {
    const { refresh_token } = body;

    // Validate required parameters
    if (!refresh_token) {
        return apiError('Missing refresh_token', 400, 'INVALID_REQUEST');
    }

    // Find refresh token
    const refreshTokenRecord = await prisma.oAuthRefreshToken.findUnique({
        where: { token: refresh_token },
        include: { user: true },
    });

    if (!refreshTokenRecord) {
        return apiError('Invalid refresh token', 400, 'INVALID_GRANT');
    }

    // Validate token hasn't been revoked
    if (refreshTokenRecord.revoked) {
        return apiError('Refresh token has been revoked', 400, 'INVALID_GRANT');
    }

    // Validate token hasn't expired
    if (new Date() > refreshTokenRecord.expiresAt) {
        return apiError('Refresh token expired', 400, 'INVALID_GRANT');
    }

    // Validate client_id matches
    if (refreshTokenRecord.clientId !== client.clientId) {
        return apiError('Client mismatch', 400, 'INVALID_GRANT');
    }

    // Update last used timestamp
    await prisma.oAuthRefreshToken.update({
        where: { token: refresh_token },
        data: { lastUsedAt: new Date() },
    });

    // Generate new access token
    const user = serializeUser(refreshTokenRecord.user);
    const accessToken = generateToken(user, false);

    // Create session in database for token validation
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 1); // 24 hours (matches JWT expiry)

    await prisma.session.create({
        data: {
            token: accessToken,
            userId: refreshTokenRecord.userId,
            expiresAt: sessionExpiresAt,
            deviceType: refreshTokenRecord.deviceType || 'ios',
        },
    });

    // Return new access token
    return apiResponse({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 86400, // 24 hours
        scope: refreshTokenRecord.scopes.join(' '),
    });
}
