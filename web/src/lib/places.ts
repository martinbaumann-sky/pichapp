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

// Lugares predefinidos para Santiago
const PREDEFINED_PLACES: PlaceResult[] = [
  {
    label: "Estadio Nacional",
    address: "Estadio Nacional Julio Martínez Prádanos, Ñuñoa, Región Metropolitana",
    lat: -33.4653,
    lng: -70.6067,
    comuna: "Ñuñoa"
  },
  {
    label: "Estadio Monumental",
    address: "Estadio Monumental David Arellano, Macul, Región Metropolitana",
    lat: -33.4569,
    lng: -70.6483,
    comuna: "Macul"
  },
  {
    label: "Club Manquehue",
    address: "Club Manquehue, Las Condes, Región Metropolitana",
    lat: -33.4167,
    lng: -70.5833,
    comuna: "Las Condes"
  },
  {
    label: "Complejo Deportivo Las Condes",
    address: "Complejo Deportivo Las Condes, Las Condes, Región Metropolitana",
    lat: -33.4167,
    lng: -70.5833,
    comuna: "Las Condes"
  },
  {
    label: "Complejo Deportivo Providencia",
    address: "Complejo Deportivo Providencia, Providencia, Región Metropolitana",
    lat: -33.4167,
    lng: -70.5833,
    comuna: "Providencia"
  },
  {
    label: "Complejo Deportivo Ñuñoa",
    address: "Complejo Deportivo Ñuñoa, Ñuñoa, Región Metropolitana",
    lat: -33.4653,
    lng: -70.6067,
    comuna: "Ñuñoa"
  },
  {
    label: "Complejo Deportivo La Florida",
    address: "Complejo Deportivo La Florida, La Florida, Región Metropolitana",
    lat: -33.5167,
    lng: -70.5833,
    comuna: "La Florida"
  },
  {
    label: "Complejo Deportivo Maipú",
    address: "Complejo Deportivo Maipú, Maipú, Región Metropolitana",
    lat: -33.5167,
    lng: -70.7667,
    comuna: "Maipú"
  },
  {
    label: "Club Deportivo Universidad Católica",
    address: "Club Deportivo Universidad Católica, Las Condes, Región Metropolitana",
    lat: -33.4167,
    lng: -70.5833,
    comuna: "Las Condes"
  },
  {
    label: "Complejo Deportivo Estadio Nacional",
    address: "Complejo Deportivo Estadio Nacional, Ñuñoa, Región Metropolitana",
    lat: -33.4653,
    lng: -70.6067,
    comuna: "Ñuñoa"
  },
  {
    label: "Cancha Club Manquehue",
    address: "Cancha Club Manquehue, Las Condes, Región Metropolitana",
    lat: -33.4167,
    lng: -70.5833,
    comuna: "Las Condes"
  },
  {
    label: "Cancha Estadio Nacional",
    address: "Cancha Estadio Nacional, Ñuñoa, Región Metropolitana",
    lat: -33.4653,
    lng: -70.6067,
    comuna: "Ñuñoa"
  },
  {
    label: "Cancha Complejo Las Condes",
    address: "Cancha Complejo Las Condes, Las Condes, Región Metropolitana",
    lat: -33.4167,
    lng: -70.5833,
    comuna: "Las Condes"
  }
];

export async function searchPlace(text: string): Promise<PlaceResult[]> {
  console.log("[PLACES] Buscando:", text);
  
  if (!text || text.trim().length < 2) {
    return [];
  }
  
  const allResults: PlaceResult[] = [];
  
  try {
    // 1. Búsqueda en OpenStreetMap para lugares generales
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=10&countrycodes=cl&bounded=1&viewbox=-71.5,-34.0,-69.5,-32.5`;
    console.log("[PLACES] Buscando en OpenStreetMap:", osmUrl);
    
    const osmRes = await fetch(osmUrl, { 
      headers: { "User-Agent": "PichangApp/1.0" }, 
      cache: "no-store" 
    });
    
    if (osmRes.ok) {
      const osmData = await osmRes.json() as any[];
      console.log("[PLACES] Resultados OpenStreetMap:", osmData.length);
      
      const osmResults = osmData.map((item) => {
        const addr = item.address || {};
        const candidates = [addr.city, addr.town, addr.village, addr.municipality, addr.suburb, addr.county].filter(Boolean) as string[];
        let comuna = candidates.find((v) => comunasRM.includes(v)) || extractComunaFromText(item.display_name);

        // Construir label amigable: calle + número cuando esté disponible
        const road = addr.road || addr.pedestrian || addr.residential || addr.footway || addr.path || addr.cycleway || addr.highway || addr.neighbourhood;
        const houseNumber = addr.house_number;
        let label: string | undefined;
        if (road && houseNumber) label = `${road} ${houseNumber}`;
        else if (road) label = road as string;
        else if (addr.neighbourhood && addr.suburb) label = `${addr.neighbourhood}, ${addr.suburb}`;
        else if (item.name) label = item.name as string;
        // Fallback: tomar las dos primeras partes del display_name para evitar valores como solo '2700'
        if (!label) {
          const parts = (item.display_name || "").split(",").map((p: string) => p.trim());
          label = parts.slice(0, 2).join(", ") || parts[0] || "Lugar";
        }
        
        return {
          label,
          address: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
          comuna,
        } as PlaceResult;
      });
      
      allResults.push(...osmResults);
    }
    
    // 2. Búsqueda específica de lugares deportivos si el texto contiene palabras relacionadas
    const sportsKeywords = ['cancha', 'club', 'estadio', 'complejo', 'deportivo', 'futbol', 'fútbol', 'gimnasio', 'polideportivo'];
    const hasSportsKeyword = sportsKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (hasSportsKeyword) {
      const sportsUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text + " deportivo")}&format=json&addressdetails=1&limit=5&countrycodes=cl&bounded=1&viewbox=-71.5,-34.0,-69.5,-32.5`;
      console.log("[PLACES] Búsqueda deportiva:", sportsUrl);
      
      const sportsRes = await fetch(sportsUrl, { 
        headers: { "User-Agent": "PichangApp/1.0" }, 
        cache: "no-store" 
      });
      
      if (sportsRes.ok) {
        const sportsData = await sportsRes.json() as any[];
        console.log("[PLACES] Resultados deportivos:", sportsData.length);
        
        const sportsResults = sportsData.map((item) => {
          const addr = item.address || {};
          const candidates = [addr.city, addr.town, addr.village, addr.municipality, addr.suburb, addr.county].filter(Boolean) as string[];
          let comuna = candidates.find((v) => comunasRM.includes(v)) || extractComunaFromText(item.display_name);

          const road = addr.road || addr.pedestrian || addr.residential || addr.footway || addr.path || addr.cycleway || addr.highway || addr.neighbourhood;
          const houseNumber = addr.house_number;
          let label: string | undefined;
          if (road && houseNumber) label = `${road} ${houseNumber}`;
          else if (road) label = road as string;
          else if (item.name) label = item.name as string;
          if (!label) {
            const parts = (item.display_name || "").split(",").map((p: string) => p.trim());
            label = parts.slice(0, 2).join(", ") || parts[0] || "Lugar";
          }
          
          return {
            label,
            address: item.display_name,
            lat: Number(item.lat),
            lng: Number(item.lon),
            comuna,
          } as PlaceResult;
        });
        
        allResults.push(...sportsResults);
      }
    }
    
    // 3. Agregar lugares predefinidos relevantes (solo si coinciden exactamente)
    const lowerText = text.toLowerCase();
    const exactMatches = PREDEFINED_PLACES.filter(place => 
      place.label.toLowerCase().includes(lowerText) || 
      place.comuna?.toLowerCase().includes(lowerText)
    );
    
    if (exactMatches.length > 0) {
      console.log("[PLACES] Coincidencias exactas encontradas:", exactMatches.length);
      allResults.push(...exactMatches);
    }
    
    // 4. Eliminar duplicados y ordenar por relevancia
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => 
        Math.abs(r.lat - result.lat) < 0.001 && Math.abs(r.lng - result.lng) < 0.001
      )
    );
    
    // 5. Ordenar por relevancia (lugares con comuna primero, luego por proximidad al centro de Santiago)
    const santiagoCenter = { lat: -33.4489, lng: -70.6693 };
    const sortedResults = uniqueResults.sort((a, b) => {
      // Priorizar lugares con comuna
      const aHasComuna = a.comuna ? 1 : 0;
      const bHasComuna = b.comuna ? 1 : 0;
      if (aHasComuna !== bHasComuna) return bHasComuna - aHasComuna;
      
      // Luego por proximidad al centro de Santiago
      const aDistance = Math.sqrt(Math.pow(a.lat - santiagoCenter.lat, 2) + Math.pow(a.lng - santiagoCenter.lng, 2));
      const bDistance = Math.sqrt(Math.pow(b.lat - santiagoCenter.lat, 2) + Math.pow(b.lng - santiagoCenter.lng, 2));
      return aDistance - bDistance;
    });
    
    const finalResults = sortedResults.slice(0, 8); // Limitar a 8 resultados
    console.log("[PLACES] Resultados finales:", finalResults.length);
    
    return finalResults;
    
  } catch (error) {
    console.error("[PLACES] Error en búsqueda:", error);
    
    // Fallback: solo lugares predefinidos relevantes
    const lowerText = text.toLowerCase();
    const fallbackResults = PREDEFINED_PLACES.filter(place => 
      place.label.toLowerCase().includes(lowerText) || 
      place.comuna?.toLowerCase().includes(lowerText)
    );
    
    return fallbackResults.slice(0, 5);
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


