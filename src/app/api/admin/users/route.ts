import { NextRequest } from 'next/server';
import { requireAdmin, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/users
 * Fetch all users with pagination, search, and sorting
 * Admin only
 */
export async function GET(req: NextRequest) {
    // Check admin authorization
    const authResult = await requireAdmin(req);
    if (!authResult.authorized) {
        return apiError(authResult.error || 'Unauthorized', 401);
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('perPage') || '10');
        const search = searchParams.get('search') || '';
        const sortField = searchParams.get('sortField') || 'firstName';
        const sortOrder = searchParams.get('sortOrder') || 'asc';

        // Build where clause for search
        const where = search
            ? {
                  OR: [
                      { email: { contains: search, mode: 'insensitive' as const } },
                      { username: { contains: search, mode: 'insensitive' as const } },
                      { firstName: { contains: search, mode: 'insensitive' as const } },
                      { lastName: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        // Build orderBy clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let orderBy: any;
        if (sortField === 'firstName') {
            orderBy = [
                { firstName: sortOrder },
                { lastName: sortOrder },
                { username: sortOrder },
            ];
        } else if (sortField === 'lastName') {
            orderBy = [
                { lastName: sortOrder },
                { firstName: sortOrder },
                { username: sortOrder },
            ];
        } else {
            orderBy = { [sortField]: sortOrder };
        }

        // Get total count
        const totalUsers = await prisma.user.count({ where });

        // Get users
        const users = await prisma.user.findMany({
            where,
            orderBy,
            skip: (page - 1) * perPage,
            take: perPage,
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
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                phoneNumber: true,
                city: true,
                country: true,
                language: true,
                timezone: true,
                gpsPermission: true,
                homeLocationName: true,
                bio: true,
                avatar: true,
                emailNotifications: true,
                _count: {
                    select: {
                        sessions: true,
                        createdLocations: true,
                        uploadedPhotos: true,
                        savedLocations: true,
                    },
                },
            },
        });

        return apiResponse({
            users: users.map(user => ({
                ...user,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                lastLoginAt: user.lastLoginAt?.toISOString() || null,
            })),
            totalUsers,
            totalPages: Math.ceil(totalUsers / perPage),
            currentPage: page,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return apiError('Failed to fetch users', 500);
    }
}
