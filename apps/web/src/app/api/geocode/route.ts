import { NextRequest, NextResponse } from "next/server";
import { searchPlace, placePhotoUrl, streetViewUrl } from "@/lib/places";
import { staticMapUrl } from "@/lib/maps";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";

const rl = createRateLimiter({ name: "geocode", limit: 20, windowSec: 60 });

export async function GET(req: NextRequest) {
  try {
    // Rate limiting por IP para proteger Nominatim/APIs
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      const retryAfter =
        typeof probe.reset === "number"
          ? new Date(probe.reset).toISOString()
          : probe.reset?.toISOString?.() ?? null;
      return NextResponse.json({ items: [], error: "rate_limited", retryAfter }, { status: 429 });
    }
    const q = new URL(req.url).searchParams.get("q");
    console.log("[GEOCODE] Query recibida:", q);
    
    if (!q || q.length < 2) {
      console.log("[GEOCODE] Query muy corta, devolviendo vacío");
      return NextResponse.json({ items: [] });
    }
    
    console.log("[GEOCODE] Buscando lugares para:", q);
    const results = await searchPlace(q);
    console.log("[GEOCODE] Resultados encontrados:", results.length);
    
    const items = results.map((r) => {
      // Asegurar label amigable
      let label = r.label?.trim();
      if (!label || /^\d+$/.test(label)) {
        const parts = (r.address || "").split(",").map((p) => p.trim());
        label = parts.slice(0, 2).join(", ") || parts[0] || label || "Lugar";
      }
      
      // Asegurar photoUrl
      const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
      const photo = r.photoRef && googleKey ? placePhotoUrl(r.photoRef) : (googleKey ? streetViewUrl(r.lat, r.lng) : (staticMapUrl({ lat: r.lat, lng: r.lng }) || ""));
      
      return {
        label,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        place_id: r.placeId,
        photoUrl: photo,
        comuna: r.comuna,
      };
    });
    
    console.log("[GEOCODE] Items procesados:", items.length);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GEOCODE] Error:", err);
    return NextResponse.json({ items: [] });
  }
}


