/**
 * Next.js Edge Proxy (middleware)
 *
 * Handles two concerns at the edge before any page renders:
 *
 * 1. @username redirect — /@johndoe → /johndoe (301, permanent, for SEO)
 * 2. Auth redirects — protects pages server-side to eliminate the
 *    client-side auth flash that occurred before React hydration.
 *
 * EDGE CONSTRAINT:
 *   Runs on Vercel's Edge Runtime — no Node.js APIs, no Prisma, no full
 *   crypto JWT verify. We do a lightweight decode of the JWT payload to
 *   check the `exp` field and presence of `userId`. Full cryptographic
 *   verification still happens inside every API route via requireAuth().
 *
 * COOKIE: auth_token (httpOnly, set by /api/auth/login)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route categories ────────────────────────────────────────────────────────

/**
 * Path prefixes that require authentication.
 * Unauthenticated users are redirected to /login?next=<pathname>.
 */
const PROTECTED_PREFIXES = [
    '/map',
    '/locations',
    '/profile',
    '/search',
    '/projects',
    '/member-support',
    '/create-with-photo',
    '/admin',
    '/ai-demo',
    '/preview',
];

/**
 * Auth-only routes — redirect to /map if the user is already logged in.
 */
const AUTH_ONLY_PREFIXES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
];

/**
 * Paths that are always public (never redirected).
 */
const PUBLIC_PREFIXES = [
    '/api',
    '/_next',
    '/support',
    '/help',
    '/terms',
    '/privacy-policy',
    '/shared',
    '/cancel-email-change',
    '/verify-email',
    '/verify-email-change',
    '/logout',
    '/app',
];

// ─── Lightweight JWT decode ──────────────────────────────────────────────────

interface TokenPayload {
    userId?: number;
    exp?: number;
}

/**
 * Decode the payload segment of a JWT without signature verification.
 * Sufficient for the expiry check — full sig verification happens in requireAuth().
 */
function decodeJwtPayload(token: string): TokenPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64)) as TokenPayload;
    } catch {
        return null;
    }
}

/** Returns true if the token looks structurally valid and not expired. */
function isTokenValid(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.userId) return false;
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
}

// ─── Proxy handler ───────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. @username redirect (existing behaviour, preserved) ──────────────
    if (pathname.startsWith('/@')) {
        const pathWithoutAt = pathname.slice(2);
        return NextResponse.redirect(
            new URL(`/${pathWithoutAt}`, request.url),
            { status: 301 }
        );
    }

    // ── 2. Always-public paths — skip auth checks ──────────────────────────
    if (pathname === '/' || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // ── 3. Determine auth state ───────────────────────────────────────────
    const token = request.cookies.get('auth_token')?.value;
    const authenticated = token ? isTokenValid(token) : false;

    // ── 4. Protected routes ────────────────────────────────────────────────
    if (PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) {
        if (!authenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // ── 5. Auth-only routes ────────────────────────────────────────────────
    if (AUTH_ONLY_PREFIXES.some(p => pathname.startsWith(p))) {
        if (authenticated) {
            return NextResponse.redirect(new URL('/map', request.url));
        }
        return NextResponse.next();
    }

    // ── 6. Everything else (public profiles, etc.) ─────────────────────────
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
