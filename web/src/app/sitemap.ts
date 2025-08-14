import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/explorar` },
    { url: `${base}/organizar` },
    { url: `${base}/dashboard` },
  ];
}


