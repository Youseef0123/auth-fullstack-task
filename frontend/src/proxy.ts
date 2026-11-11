import { NextResponse, type NextRequest } from 'next/server';
import { ROUTES } from '@/lib/routes';

const ACCESS_TOKEN_COOKIE = 'access_token';
const GUEST_ONLY_PATHS: readonly string[] = [ROUTES.signIn, ROUTES.signUp];

/**
 * Optimistic redirects based only on the cookie's presence; it cannot read the
 * httpOnly JWT's validity. The backend stays the authority: the protected
 * layout calls /api/users/me and handles a rejected cookie.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const isGuestOnly = GUEST_ONLY_PATHS.includes(request.nextUrl.pathname);

  if (!hasSession && !isGuestOnly) {
    return NextResponse.redirect(new URL(ROUTES.signIn, request.url));
  }
  if (hasSession && isGuestOnly) {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/signin', '/signup'],
};
