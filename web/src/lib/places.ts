const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
import { comunasRM } from "@/lib/comunas-rm";

type PlaceResult = {
  label: string;
  address: string;
  placeId?: string;
  lat: number;
  lng: number;
  comuna?: string;
  photoRef?: string;
};

export function extractComunaFromText(text: string): string | undefined {
  const lowered = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return comunasRM.find((c) => lowered.includes(c.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()));
}

export async function searchPlace(text: string): Promise<PlaceResult[]> {
  // Fallback gratuito si no hay Google KEY
  if (!KEY) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=6&countrycodes=cl`;
      const res = await fetch(url, { headers: { "User-Agent": "PichApp/1.0" }, cache: "no-store" });
      const rows = (await res.json()) as any[];
      return rows.map((r) => {
        const addr = r.address || {};
        const candidates = [addr.city, addr.town, addr.village, addr.municipality, addr.suburb, addr.county].filter(Boolean) as string[];
        let comuna = candidates.find((v) => comunasRM.includes(v)) || extractComunaFromText(r.display_name);
        return {
          label: r.display_name?.split(",")[0] ?? "Lugar",
          address: r.display_name,
          lat: Number(r.lat),
          lng: Number(r.lon),
          comuna,
        } as PlaceResult;
      });
    } catch {
      return [];
    }
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(text)}&key=${KEY}&language=es-CL&region=cl`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const results = (data.results ?? []) as any[];
    return results.map((r) => ({
      label: r.name as string,
      address: r.formatted_address as string,
      placeId: r.place_id as string,
      lat: r.geometry?.location?.lat as number,
      lng: r.geometry?.location?.lng as number,
      photoRef: r.photos?.[0]?.photo_reference as string | undefined,
      comuna: extractComunaFromText(r.formatted_address as string),
    }));
  } catch {
    return [];
  }
}

export function placePhotoUrl(photoRef: string, maxWidth = 800): string {
  if (!KEY) return "";
  const base = "https://maps.googleapis.com/maps/api/place/photo";
  const params = new URLSearchParams({ maxwidth: String(maxWidth), photoreference: photoRef, key: KEY });
  return `${base}?${params.toString()}`;
}

export function streetViewUrl(lat: number, lng: number, width = 800, height = 400): string {
  if (!KEY) return "";
  const base = "https://maps.googleapis.com/maps/api/streetview";
  const params = new URLSearchParams({ size: `${width}x${height}`, location: `${lat},${lng}`, key: KEY });
  return `${base}?${params.toString()}`;
}


