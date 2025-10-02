import { loadEnvConfig } from "@next/env";
import path from "path";
import type { NextConfig } from "next";

loadEnvConfig(path.resolve(__dirname, ".."), process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    // En producci??n se recomienda activar compilaci??n estricta.
    // Puedes forzarlo con STRICT_BUILD=1 en el entorno de deploy.
    ignoreBuildErrors: process.env.STRICT_BUILD === '1' ? false : true,
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
      "img-src 'self' data: blob: https://*.openstreetmap.org https://staticmap.openstreetmap.de https://source.unsplash.com https://maps.googleapis.com",
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

export default nextConfig;
