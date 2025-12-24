import { NextRequest } from 'next/server';
import prisma from './prisma';

/**
 * Security event types
 */
export const SecurityEventType = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    PASSWORD_RESET_REQUEST: 'password_reset_request',
    PASSWORD_RESET_SUCCESS: 'password_reset_success',
    PASSWORD_CHANGE: 'password_change',
    FAILED_LOGIN: 'failed_login',
    ACCOUNT_LOCKED: 'account_locked',
    EMAIL_VERIFICATION: 'email_verification',
    SESSION_CREATED: 'session_created',
    SESSION_REVOKED: 'session_revoked',
} as const;

export type SecurityEventTypeValue = typeof SecurityEventType[keyof typeof SecurityEventType];

/**
 * Extract IP address from NextRequest
 */
export function getClientIP(request: NextRequest): string | null {
    // Try various headers in order of preference
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Cloudflare
    const cfConnecting = request.headers.get('cf-connecting-ip');
    if (cfConnecting) {
        return cfConnecting;
    }

    // Fall back to remote address (may not be available in Next.js)
    return null;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string | null {
    return request.headers.get('user-agent');
}

/**
 * Parse device type from user agent
 */
export function getDeviceType(userAgent: string | null): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    }

    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    }

    return 'desktop';
}

/**
 * Get browser name from user agent
 */
export function getBrowserName(userAgent: string | null): string {
    if (!userAgent) return 'Unknown';

    const ua = userAgent.toLowerCase();

    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('chrome/')) return 'Chrome';
    if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox/')) return 'Firefox';
    if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';

    return 'Unknown';
}

/**
 * Log a security event
 */
export async function logSecurityEvent({
    userId,
    eventType,
    request,
    success = true,
    metadata = {},
}: {
    userId?: number;
    eventType: SecurityEventTypeValue;
    request?: NextRequest;
    success?: boolean;
    metadata?: Record<string, any>;
}): Promise<void> {
    try {
        const ipAddress = request ? getClientIP(request) : null;
        const userAgent = request ? getUserAgent(request) : null;

        await prisma.securityLog.create({
            data: {
                userId: userId || null,
                eventType,
                ipAddress,
                userAgent,
                success,
                metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
            },
        });
    } catch (error) {
        // Log error but don't throw - security logging should never break the app
        console.error('Failed to log security event:', error);
    }
}

/**
 * Get recent security logs for a user
 */
export async function getUserSecurityLogs(userId: number, limit: number = 50) {
    return prisma.securityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
            id: true,
            eventType: true,
            ipAddress: true,
            userAgent: true,
            location: true,
            success: true,
            metadata: true,
            createdAt: true,
        },
    });
}

/**
 * Get all failed login attempts for an email (for rate limiting)
 */
export async function getFailedLoginAttempts(email: string, windowMinutes: number = 60): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await prisma.securityLog.count({
        where: {
            eventType: SecurityEventType.FAILED_LOGIN,
            success: false,
            createdAt: { gte: since },
            metadata: {
                path: "email",
                equals: email,
            },
        },
    });

    return count;
}

/**
 * Get password reset request count for rate limiting
 */
export async function getPasswordResetRequestCount(email: string, windowMinutes: number = 60): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await prisma.securityLog.count({
        where: {
            eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
            createdAt: { gte: since },
            metadata: {
                path: "email",
                equals: email,
            },
        },
    });

    return count;
}

/**
 * Format security log for display
 */
export function formatSecurityLog(log: any): string {
    const browser = getBrowserName(log.userAgent);
    const device = getDeviceType(log.userAgent);

    const parts = [];

    if (browser !== 'Unknown') parts.push(browser);
    if (device !== 'unknown') parts.push(device);
    if (log.ipAddress) parts.push(log.ipAddress);

    return parts.join(' • ');
}
