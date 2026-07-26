import { NextRequest } from 'next/server';
import { getImageKitAuthParams } from '@/lib/storage';
import { apiResponse, apiError, requireAuth } from '@/lib/api-middleware';

/**
 * GET /api/imagekit/auth
 * Generate storage authentication parameters for client-side direct uploads
 */
export async function GET(request: NextRequest) {
    try {
        // Verify user is authenticated
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const authParams = getImageKitAuthParams();

        return apiResponse(authParams);
    } catch (error: any) {
        console.error('Error generating storage auth params:', error);
        return apiError('Failed to generate authentication', 500, 'AUTH_ERROR');
    }
}
