const MAPBOX_BASE = "https://api.mapbox.com/styles/v1/mapbox/streets-v12/static";

export function buildStaticMapUrl(params: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  pixelRatio?: number; // 1 or 2
  markerColor?: string; // hex without #
}): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  const { lat, lng } = params;
  const zoom = params.zoom ?? 15;
  const width = Math.min(Math.max(params.width ?? 600, 100), 1280);
  const height = Math.min(Math.max(params.height ?? 400, 100), 1280);
  const ratio = params.pixelRatio === 2 ? "@2x" : "";
  const color = params.markerColor ?? "ff4d4f";
  const marker = `pin-l+${color}(${lng},${lat})`;
  const center = `${lng},${lat},${zoom}`;
  const size = `${width}x${height}${ratio}`;
  const url = `${MAPBOX_BASE}/${marker}/${center}/${size}?access_token=${encodeURIComponent(
    token
  )}`;
  return url;
}

export function staticMapUrl({ lat, lng }: { lat: number; lng: number }) {
  return buildStaticMapUrl({ lat, lng, pixelRatio: 2, width: 1200, height: 600 });
}


