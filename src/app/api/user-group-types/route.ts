import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth, withAuth } from '@/lib/api-middleware';
import { sanitizeUserInput } from '@/lib/sanitize';
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from '@/lib/rate-limit';
import type { PublicUser } from '@/types/user';

// Preset group types (always returned alongside custom types)
const PRESET_GROUP_TYPES = ['EVENT', 'ROUTE', 'STORY', 'COVERAGE'];

/**
 * GET /api/user-group-types
 * List preset types + user's custom group types
 */
export const GET = withAuth(async (request: NextRequest, user: PublicUser) => {
    const customTypes = await prisma.userGroupType.findMany({
        where: { userId: user.id },
        orderBy: { typeName: 'asc' },
    });

    return apiResponse({
        presets: PRESET_GROUP_TYPES,
        customTypes: customTypes.map(t => ({
            id: t.id,
            typeName: t.typeName,
            createdAt: t.createdAt,
        })),
    });
});

/**
 * POST /api/user-group-types
 * Create a custom group type for the user
 * Body: { typeName: string }
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limit
        const rateLimitResult = await rateLimit(request, {
            ...RateLimitPresets.LENIENT,
            keyPrefix: 'user-group-types-post',
        });
        if (!rateLimitResult.allowed) {
            const response = apiError(
                `Too many requests. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`,
                429,
                'RATE_LIMIT_EXCEEDED'
            );
            addRateLimitHeaders(response.headers, rateLimitResult);
            return response;
        }

        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const body = await request.json();

        let { typeName } = body;

        if (!typeName || typeof typeName !== 'string') {
            return apiError('Type name is required', 400, 'VALIDATION_ERROR');
        }

        typeName = sanitizeUserInput(typeName).trim();

        if (typeName.length === 0 || typeName.length > 50) {
            return apiError('Type name must be between 1 and 50 characters', 400, 'VALIDATION_ERROR');
        }

        // Check if it conflicts with presets
        if (PRESET_GROUP_TYPES.includes(typeName.toUpperCase())) {
            return apiError(`"${typeName}" is a preset type and cannot be added as custom`, 409, 'CONFLICT');
        }

        // Check for duplicate
        const existing = await prisma.userGroupType.findUnique({
            where: {
                userId_typeName: {
                    userId: user.id,
                    typeName,
                },
            },
        });

        if (existing) {
            return apiError(`Custom type "${typeName}" already exists`, 409, 'CONFLICT');
        }

        const customType = await prisma.userGroupType.create({
            data: {
                userId: user.id,
                typeName,
            },
        });

        return apiResponse({
            customType: {
                id: customType.id,
                typeName: customType.typeName,
                createdAt: customType.createdAt,
            },
        }, 201);
    } catch (error: any) {
        console.error('Error creating custom group type:', error);
        return apiError(error.message || 'Failed to create custom type', 500, 'CREATE_ERROR');
    }
}

/**
 * DELETE /api/user-group-types
 * Delete a custom group type
 * Body: { typeName: string }
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
        }

        const user = authResult.user;
        const body = await request.json();
        const { typeName } = body;

        if (!typeName) {
            return apiError('Type name is required', 400, 'VALIDATION_ERROR');
        }

        const deleted = await prisma.userGroupType.deleteMany({
            where: {
                userId: user.id,
                typeName,
            },
        });

        if (deleted.count === 0) {
            return apiError('Custom type not found', 404, 'NOT_FOUND');
        }

        return apiResponse({ message: 'Custom type deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting custom group type:', error);
        return apiError(error.message || 'Failed to delete custom type', 500, 'DELETE_ERROR');
    }
}
