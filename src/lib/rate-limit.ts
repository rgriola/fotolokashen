/**
 * Rate Limiting Utility
 * Prevents brute force attacks and API abuse
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

// In-memory store for rate limiting
// In production, use Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old records every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    /**
     * Maximum number of requests allowed within the window
     * @default 5
     */
    limit?: number;

    /**
     * Time window in milliseconds
     * @default 900000 (15 minutes)
     */
    windowMs?: number;

    /**
     * Unique identifier for this rate limiter
     * Use different keys for different endpoints
     * @example 'login', 'register', 'api'
     */
    keyPrefix?: string;
}

export interface RateLimitResult {
    /**
     * Whether the request is allowed
     */
    allowed: boolean;

    /**
     * Number of requests remaining in current window
     */
    remaining: number;

    /**
     * Total limit for this endpoint
     */
    limit: number;

    /**
     * Timestamp when the rate limit resets (Unix timestamp)
     */
    resetAt: number;

    /**
     * Time until reset in milliseconds
     */
    retryAfter: number;
}

/**
 * Rate limit a request based on IP address
 * 
 * @example
 * ```typescript
 * const { allowed, remaining, retryAfter } = rateLimit(request, {
 *   limit: 5,
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   keyPrefix: 'login'
 * });
 * 
 * if (!allowed) {
 *   return apiError(
 *     `Too many attempts. Try again in ${Math.ceil(retryAfter / 1000)} seconds`,
 *     429,
 *     'RATE_LIMIT_EXCEEDED'
 *   );
 * }
 * ```
 */
export function rateLimit(
    request: Request,
    config: RateLimitConfig = {}
): RateLimitResult {
    const {
        limit = 5,
        windowMs = 15 * 60 * 1000, // 15 minutes default
        keyPrefix = 'default',
    } = config;

    // Get IP address from request
    const ip = getIpAddress(request);

    // Create unique key for this IP + endpoint combo
    const key = `${keyPrefix}:${ip}`;

    const now = Date.now();
    const record = rateLimitStore.get(key);

    // No existing record, create new one
    if (!record || record.resetAt < now) {
        const newRecord: RateLimitRecord = {
            count: 1,
            resetAt: now + windowMs,
        };
        rateLimitStore.set(key, newRecord);

        return {
            allowed: true,
            remaining: limit - 1,
            limit,
            resetAt: newRecord.resetAt,
            retryAfter: 0,
        };
    }

    // Increment count
    record.count++;

    // Check if over limit
    if (record.count > limit) {
        return {
            allowed: false,
            remaining: 0,
            limit,
            resetAt: record.resetAt,
            retryAfter: record.resetAt - now,
        };
    }

    // Within limit
    return {
        allowed: true,
        remaining: limit - record.count,
        limit,
        resetAt: record.resetAt,
        retryAfter: 0,
    };
}

/**
 * Extract IP address from request
 * Handles various proxy headers
 */
function getIpAddress(request: Request): string {
    const headers = request.headers;

    // Check common proxy headers
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Take the LAST entry — on Vercel/reverse-proxies, the proxy appends
        // the real client IP at the end. The first entry is client-controlled
        // and can be spoofed via a forged X-Forwarded-For header.
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[ips.length - 1];
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    const cloudflareIp = headers.get('cf-connecting-ip');
    if (cloudflareIp) {
        return cloudflareIp;
    }

    // Fallback
    return 'unknown';
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
    /**
     * Strict: For sensitive endpoints like login, password reset
     * 5 requests per 15 minutes
     */
    STRICT: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,

    /**
     * Moderate: For general authentication endpoints
     * 10 requests per 15 minutes
     */
    MODERATE: {
        limit: 10,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,

    /**
     * Lenient: For general API endpoints
     * 100 requests per 15 minutes
     */
    LENIENT: {
        limit: 100,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,

    /**
     * Upload: For file uploads
     * 20 requests per hour
     */
    UPLOAD: {
        limit: 20,
        windowMs: 60 * 60 * 1000,
    } as RateLimitConfig,
} as const;

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
    headers: Headers,
    result: RateLimitResult
): Headers {
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetAt.toString());

    if (!result.allowed) {
        headers.set('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
    }

    return headers;
}
