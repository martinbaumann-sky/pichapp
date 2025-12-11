// @ts-nocheck
import { loadEnvConfig } from "@next/env";
import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

loadEnvConfig(path.resolve(__dirname), process.env.NODE_ENV !== "production");

const isProd = process.env.NODE_ENV === "production";
const releaseName =
  process.env.SENTRY_RELEASE ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT;

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
    ];
    // CSP basica (ajusta si agregas mas origenes)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https://*.openstreetmap.org https://staticmap.openstreetmap.de https://source.unsplash.com https://maps.googleapis.com https://*.supabase.co https://*.supabase.in",
      "font-src 'self' data:",
      "connect-src 'self' https://nominatim.openstreetmap.org https://api.mapbox.com https://*.upstash.io",
      "frame-ancestors 'none'",
    ].join("; ");
    const headers = [
      ...securityHeaders,
      { key: "Content-Security-Policy", value: csp },
      ...(isProd
        ? ([{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] as const)
        : []),
    ];
    const allRoutes = { source: "/:path*", headers } as const;
    const extra: any[] = [];
    // In development, aggressively disable caching of Next.js chunks to avoid ChunkLoadError from stale caches
    if (!isProd) {
      extra.push({
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      });
    }
    return [allRoutes, ...extra];
  },
};

const disableSentryUpload =
  !process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT;

const sentryConfig = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: releaseName ? { name: releaseName } : undefined,
  disableServerWebpackPlugin: disableSentryUpload,
  disableClientWebpackPlugin: disableSentryUpload,
  dryRun: disableSentryUpload,
  hideSourceMaps: true,
  disableLogger: true,
  widenClientFileUpload: true,
};

export default isProd ? withSentryConfig(nextConfig, sentryConfig) : nextConfig;
