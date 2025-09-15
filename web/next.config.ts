import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    // En producción se recomienda activar compilación estricta.
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
    // CSP básica (ajusta si agregas más orígenes)
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
    return [
      { source: '/:path*', headers },
    ];
  },
};

export default nextConfig;
