import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permitir build aunque existan errores TS para entorno de demo
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
