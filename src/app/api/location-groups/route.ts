import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, requireAuth, withAuth } from '@/lib/api-middleware';
import { sanitizeUserInput } from '@/lib/sanitize';
import { rateLimit, RateLimitPresets, addRateLimitHeaders } from '@/lib/rate-limit';
import type { PublicUser } from '@/types/user';

// Preset group types (available to all users)
const PRESET_GROUP_TYPES = ['EVENT', 'ROUTE', 'STORY', 'COVERAGE'];

/**
 * GET /api/location-groups
 * List all location groups for the authenticated user
 */
export const GET = withAuth(async (request: NextRequest, user: PublicUser) => {
    const groups = await prisma.locationGroup.findMany({
        where: { createdBy: user.id },
        include: {
            locations: {
                select: {
                    id: true,
                    name: true,
                    lat: true,
                    lng: true,
                    type: true,
                    photos: {
                        where: { isPrimary: true },
                        select: { id: true, imagekitFilePath: true },
                        take: 1,
                    },
                },
            },
            _count: {
                select: { locations: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return apiResponse({
        groups: groups.map(g => ({
            ...g,
            locationCount: g._count.locations,
            _count: undefined,
        })),
    });
});

/**
 * POST /api/location-groups
 * Create a new location group
 * Body: { name, type?, description?, startTime?, endTime? }
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limit
        const rateLimitResult = await rateLimit(request, {
            ...RateLimitPresets.LENIENT,
            keyPrefix: 'location-groups-post',
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

        let { name, type, description, startTime, endTime } = body;

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return apiError('Group name is required', 400, 'VALIDATION_ERROR');
        }

        // Sanitize inputs
        name = sanitizeUserInput(name);
        description = description ? sanitizeUserInput(description) : undefined;
        type = type ? sanitizeUserInput(type) : undefined;

        // Validate lengths
        if (name.length > 100) {
            return apiError('Group name must be 100 characters or less', 400, 'VALIDATION_ERROR');
        }
        if (description && description.length > 500) {
            return apiError('Description must be 500 characters or less', 400, 'VALIDATION_ERROR');
        }
        if (type && type.length > 50) {
            return apiError('Type must be 50 characters or less', 400, 'VALIDATION_ERROR');
        }

        // If it's a custom type (not preset), auto-save it to user's custom types
        if (type && !PRESET_GROUP_TYPES.includes(type.toUpperCase())) {
            await prisma.userGroupType.upsert({
                where: {
                    userId_typeName: {
                        userId: user.id,
                        typeName: type,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    typeName: type,
                },
            });
        }

        const group = await prisma.locationGroup.create({
            data: {
                name,
                ...(type && { type }),
                ...(description && { description }),
                ...(startTime && { startTime: new Date(startTime) }),
                ...(endTime && { endTime: new Date(endTime) }),
                createdBy: user.id,
            },
            include: {
                _count: {
                    select: { locations: true },
                },
            },
        });

        return apiResponse({
            group: {
                ...group,
                locationCount: group._count.locations,
                _count: undefined,
            },
        }, 201);
    } catch (error: any) {
        console.error('Error creating location group:', error);
        return apiError(
            error.message || 'Failed to create location group',
            500,
            'CREATE_ERROR'
        );
    }
}
