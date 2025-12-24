import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { getUserSecurityLogs, formatSecurityLog } from '@/lib/security';

/**
 * GET /api/auth/security-logs
 * Get current user's security activity log
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authorized || !authResult.user) {
            return apiError(authResult.error || 'Unauthorized', 401, 'UNAUTHORIZED');
        }

        const logs = await getUserSecurityLogs(authResult.user.id, 50);

        // Format logs for display
        const formattedLogs = logs.map((log: any) => ({
            ...log,
            displayInfo: formatSecurityLog(log),
        }));

        return apiResponse({
            success: true,
            logs: formattedLogs,
        });
    } catch (error: any) {
        console.error('Security logs error:', error);
        return apiError('Failed to fetch security logs', 500, 'SERVER_ERROR');
    }
}
