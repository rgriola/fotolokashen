import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect @username URLs to clean URLs (e.g., /@johndoe → /johndoe)
  // Using 301 (permanent redirect) for SEO and backwards compatibility
  if (pathname.startsWith('/@')) {
    const pathWithoutAt = pathname.slice(2); // Remove /@ to get username/rest/of/path
    return NextResponse.redirect(
      new URL(`/${pathWithoutAt}`, request.url),
      { status: 301 } // Permanent redirect
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
