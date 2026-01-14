import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * POST /api/auth/oauth/authorize
 * 
 * OAuth2 Authorization Endpoint with PKCE
 * Generates an authorization code for the client to exchange for tokens
 * 
 * Request body:
 * - client_id: OAuth client identifier
 * - response_type: Must be 'code'
 * - redirect_uri: Where to redirect after authorization
 * - code_challenge: SHA256 hash of the code verifier (PKCE)
 * - code_challenge_method: Must be 'S256'
 * - scope: Space-separated list of scopes
 * - state: Optional CSRF protection token
 */
export async function POST(request: NextRequest) {
    try {
        // Require user to be authenticated via existing session
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError('Authentication required', 401);
        }

        const body = await request.json();
        const {
            client_id,
            response_type,
            redirect_uri,
            code_challenge,
            code_challenge_method,
            scope,
            state,
        } = body;

        // Validate required parameters
        if (!client_id || !response_type || !redirect_uri || !code_challenge || !code_challenge_method) {
            return apiError('Missing required parameters', 400, 'INVALID_REQUEST');
        }

        // Validate response_type
        if (response_type !== 'code') {
            return apiError('Invalid response_type. Only "code" is supported', 400, 'UNSUPPORTED_RESPONSE_TYPE');
        }

        // Validate code_challenge_method
        if (code_challenge_method !== 'S256') {
            return apiError('Invalid code_challenge_method. Only "S256" is supported', 400, 'INVALID_REQUEST');
        }

        // Validate client exists
        const client = await prisma.oAuthClient.findUnique({
            where: { clientId: client_id },
        });

        if (!client) {
            return apiError('Invalid client_id', 400, 'INVALID_CLIENT');
        }

        // Validate redirect_uri is registered for this client
        if (!client.redirectUris.includes(redirect_uri)) {
            return apiError('Invalid redirect_uri', 400, 'INVALID_REQUEST');
        }

        // Parse and validate scopes
        const requestedScopes = scope ? scope.split(' ') : [];
        const invalidScopes = requestedScopes.filter((s: string) => !client.scopes.includes(s));

        if (invalidScopes.length > 0) {
            return apiError(`Invalid scopes: ${invalidScopes.join(', ')}`, 400, 'INVALID_SCOPE');
        }

        // Generate authorization code
        const authorizationCode = crypto.randomBytes(32).toString('base64url');

        // Calculate expiry (10 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Store authorization code in database
        await prisma.oAuthAuthorizationCode.create({
            data: {
                code: authorizationCode,
                clientId: client_id,
                userId: authResult.user.id,
                redirectUri: redirect_uri,
                codeChallenge: code_challenge,
                codeChallengeMethod: code_challenge_method,
                scopes: requestedScopes,
                expiresAt,
            },
        });

        // Return authorization code
        return apiResponse({
            authorization_code: authorizationCode,
            ...(state && { state }),
        });

    } catch (error) {
        console.error('OAuth authorization error:', error);
        return apiError('Authorization failed', 500, 'SERVER_ERROR');
    }
}
