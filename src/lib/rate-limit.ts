/**
 * Rate Limiting Utility
 * 
 * Uses Upstash Redis (@upstash/ratelimit) for production — survives serverless
 * cold starts and works across multiple instances.
 * 
 * Falls back to in-memory Map for local development (no Redis required).
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Types ──────────────────────────────────────────────────────────────────

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
    /** Whether the request is allowed */
    allowed: boolean;
    /** Number of requests remaining in current window */
    remaining: number;
    /** Total limit for this endpoint */
    limit: number;
    /** Timestamp when the rate limit resets (Unix timestamp) */
    resetAt: number;
    /** Time until reset in milliseconds */
    retryAfter: number;
}

// ─── Redis setup ────────────────────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(UPSTASH_URL && UPSTASH_TOKEN);

// Lazy-init Redis client (only when env vars are present)
let redis: Redis | null = null;
function getRedis(): Redis {
    if (!redis) {
        redis = new Redis({
            url: UPSTASH_URL!,
            token: UPSTASH_TOKEN!,
        });
    }
    return redis;
}

// Cache of Ratelimit instances keyed by "prefix:limit:windowMs"
const ratelimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(prefix: string, limit: number, windowMs: number): Ratelimit {
    const key = `${prefix}:${limit}:${windowMs}`;
    let rl = ratelimiters.get(key);
    if (!rl) {
        // Convert ms window to the closest Upstash duration string
        const windowSec = Math.max(1, Math.round(windowMs / 1000));
        rl = new Ratelimit({
            redis: getRedis(),
            limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
            prefix: `ratelimit:${prefix}`,
            analytics: false,
        });
        ratelimiters.set(key, rl);
    }
    return rl;
}

// ─── In-memory fallback (local dev) ─────────────────────────────────────────

interface InMemoryRecord {
    count: number;
    resetAt: number;
}

const memoryStore = new Map<string, InMemoryRecord>();

// Cleanup stale records every 5 minutes (dev only)
if (!useRedis) {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of memoryStore.entries()) {
            if (record.resetAt < now) {
                memoryStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

function rateLimitInMemory(identifier: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const record = memoryStore.get(identifier);

    if (!record || record.resetAt < now) {
        memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, limit, resetAt: now + windowMs, retryAfter: 0 };
    }

    record.count++;

    if (record.count > limit) {
        return { allowed: false, remaining: 0, limit, resetAt: record.resetAt, retryAfter: record.resetAt - now };
    }

    return { allowed: true, remaining: limit - record.count, limit, resetAt: record.resetAt, retryAfter: 0 };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Rate limit a request based on IP address.
 * 
 * - **Production (Upstash):** Distributed, survives cold starts, sliding window.
 * - **Development (in-memory):** Fixed window, per-process. No setup required.
 *
 * @example
 * ```typescript
 * const result = await rateLimit(request, {
 *   limit: 5,
 *   windowMs: 15 * 60 * 1000,
 *   keyPrefix: 'login'
 * });
 * if (!result.allowed) {
 *   return apiError(`Too many attempts. Try again in ${Math.ceil(result.retryAfter / 1000)} seconds`, 429);
 * }
 * ```
 */
export async function rateLimit(
    request: Request,
    config: RateLimitConfig = {}
): Promise<RateLimitResult> {
    const {
        limit = 5,
        windowMs = 15 * 60 * 1000,
        keyPrefix = 'default',
    } = config;

    const ip = getIpAddress(request);
    const identifier = `${keyPrefix}:${ip}`;

    // ── Upstash path (production) ──
    if (useRedis) {
        try {
            const rl = getUpstashLimiter(keyPrefix, limit, windowMs);
            const { success, remaining, reset } = await rl.limit(identifier);

            return {
                allowed: success,
                remaining,
                limit,
                resetAt: reset,
                retryAfter: success ? 0 : Math.max(0, reset - Date.now()),
            };
        } catch (error) {
            // If Redis is unreachable, fail open (allow the request) to avoid
            // a total outage. Log the error for ops visibility.
            console.error('[rate-limit] Upstash error — failing open:', error);
            return { allowed: true, remaining: limit, limit, resetAt: Date.now() + windowMs, retryAfter: 0 };
        }
    }

    // ── In-memory path (local dev) ──
    return rateLimitInMemory(identifier, limit, windowMs);
}

/**
 * Extract IP address from request.
 * Trusts the LAST entry in x-forwarded-for (Vercel appends the real IP there).
 */
function getIpAddress(request: Request): string {
    const headers = request.headers;

    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[ips.length - 1];
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;

    const cloudflareIp = headers.get('cf-connecting-ip');
    if (cloudflareIp) return cloudflareIp;

    return 'unknown';
}

// ─── Presets ────────────────────────────────────────────────────────────────

export const RateLimitPresets = {
    /** Strict: 5 requests per 15 minutes (login, password reset) */
    STRICT: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,

    /** Moderate: 10 requests per 15 minutes (registration) */
    MODERATE: {
        limit: 10,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,

    /** Lenient: 100 requests per 15 minutes (general API) */
    LENIENT: {
        limit: 100,
        windowMs: 15 * 60 * 1000,
    } as RateLimitConfig,

    /** Upload: 20 requests per hour (file uploads) */
    UPLOAD: {
        limit: 20,
        windowMs: 60 * 60 * 1000,
    } as RateLimitConfig,
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

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
