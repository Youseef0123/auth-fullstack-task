import type { NextConfig } from 'next';
import { z } from 'zod';

const envSchema = z.object({
  BACKEND_URL: z.url({
    protocol: /^https?$/,
    error: 'BACKEND_URL must be an http(s) URL such as http://localhost:4000',
  }),
});

/** Validated when the rewrites are built (next dev / next build), so a bad value fails fast. */
function getBackendUrl(): string {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid frontend environment (see .env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data.BACKEND_URL.replace(/\/+$/, '');
}

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${getBackendUrl()}/api/:path*`,
      },
    ];
  },
  async headers() {
    // API responses keep the backend's own (helmet) headers.
    return [{ source: '/((?!api/).*)', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
