// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { ACCESS_TOKEN_COOKIE } from '@/lib/session-cookie';
import { config, proxy } from '@/proxy';

const ORIGIN = 'http://localhost:3000';
const SESSION_COOKIE = `${ACCESS_TOKEN_COOKIE}=any-value`;

function run(pathname: string, cookie?: string) {
  const request = new NextRequest(new URL(pathname, ORIGIN), {
    headers: cookie ? { cookie } : {},
  });
  return proxy(request);
}

function redirectTarget(response: Response): string | null {
  return response.status === 307 ? response.headers.get('location') : null;
}

/** NextResponse.next() marks "continue to the route" with this header. */
function passesThrough(response: Response): boolean {
  return response.headers.get('x-middleware-next') === '1';
}

describe('proxy (optimistic route protection)', () => {
  it.each(['/app', '/app/settings'])(
    'redirects %s to /signin without an access_token cookie',
    (pathname) => {
      expect(redirectTarget(run(pathname))).toBe(`${ORIGIN}/signin`);
    },
  );

  it('treats an empty access_token cookie as no session', () => {
    expect(redirectTarget(run('/app', `${ACCESS_TOKEN_COOKIE}=`))).toBe(
      `${ORIGIN}/signin`,
    );
  });

  it.each(['/signin', '/signup'])(
    'redirects %s to /app when an access_token cookie is present',
    (pathname) => {
      expect(redirectTarget(run(pathname, SESSION_COOKIE))).toBe(
        `${ORIGIN}/app`,
      );
    },
  );

  it('lets a request with a cookie through to /app (the backend validates it)', () => {
    expect(passesThrough(run('/app', SESSION_COOKIE))).toBe(true);
  });

  it.each(['/signin', '/signup'])(
    'lets %s through without a cookie',
    (pathname) => {
      expect(passesThrough(run(pathname))).toBe(true);
    },
  );

  it.each(['/', '/application', '/api/users/me', '/somewhere'])(
    'lets other paths such as %s through',
    (pathname) => {
      expect(passesThrough(run(pathname))).toBe(true);
      expect(passesThrough(run(pathname, SESSION_COOKIE))).toBe(true);
    },
  );

  it('only runs on the protected and guest-only routes', () => {
    expect(config.matcher).toEqual(['/app/:path*', '/signin', '/signup']);
  });
});
