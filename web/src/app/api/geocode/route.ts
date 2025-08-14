import { NextRequest, NextResponse } from "next/server";
import { searchPlace, placePhotoUrl, streetViewUrl } from "@/lib/places";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q");
    if (!q || q.length < 3) return NextResponse.json({ items: [] });
    const results = await searchPlace(q);
    const items = results.map((r) => ({
      label: r.label,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      place_id: r.placeId,
      photoUrl: r.photoRef ? placePhotoUrl(r.photoRef) : streetViewUrl(r.lat, r.lng),
      comuna: r.comuna,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ items: [] });
  }
}


