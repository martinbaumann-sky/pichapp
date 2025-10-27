import { loadEnvConfig } from "@next/env";
import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

loadEnvConfig(path.resolve(__dirname), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ];
    // CSP bosica (ajusta si agregas mos or??genes)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https://*.openstreetmap.org https://staticmap.openstreetmap.de https://source.unsplash.com https://maps.googleapis.com https://*.supabase.co https://*.supabase.in",
      "font-src 'self' data:",
      "connect-src 'self' https://nominatim.openstreetmap.org https://api.mapbox.com https://*.upstash.io",
      "frame-ancestors 'none'",
    ].join('; ');
    const headers = [
      ...securityHeaders,
      { key: 'Content-Security-Policy', value: csp },
      ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' } as const] : []),
    ];
    const allRoutes = { source: '/:path*', headers } as const;
    const extra: any[] = [];
    // In development, aggressively disable caching of Next.js chunks to avoid ChunkLoadError from stale caches
    if (!isProd) {
      extra.push({
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      });
    }
    return [allRoutes, ...extra];
  },
};

const disableSentryUpload = !process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT;

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: process.env.SENTRY_RELEASE,
  disableServerWebpackPlugin: disableSentryUpload,
  disableClientWebpackPlugin: disableSentryUpload,
  dryRun: disableSentryUpload,
}, {
  hideSourceMaps: true,
  widenClientFileUpload: true,
});
