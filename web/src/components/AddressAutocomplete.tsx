"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { staticMapUrl } from "@/lib/maps";

type Suggestion = { label: string; address: string; lat: number; lng: number; place_id?: string; photoUrl?: string; comuna?: string };
type Props = {
  value: string;
  onChange: (v: { venueName?: string; venueAddress?: string; lat?: number; lng?: number; display?: string; place_id?: string; photoUrl?: string; comuna?: string }) => void;
};

export default function AddressAutocomplete({ value, onChange }: Props) {
  const [q, setQ] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Usar useCallback para estabilizar la función onChange
  const handleChange = useCallback((display: string) => {
    onChange({ display });
  }, [onChange]);

  const handleSelect = useCallback((s: Suggestion) => {
    setSelected(s);
    setOpen(false);
    const display = s.label || s.address;
    setQ(display);
    onChange({ 
      venueName: s.label, 
      venueAddress: s.address, 
      lat: s.lat, 
      lng: s.lng, 
      display, 
      place_id: s.place_id, 
      photoUrl: s.photoUrl,
      comuna: s.comuna,
    });
  }, [onChange]);

  useEffect(() => {
    if (!q || q.length < 3) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ac.signal, cache: "no-store" });
        const data = await res.json();
        setSuggestions(data.items ?? []);
        setOpen(true);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(id);
      ac.abort();
    };
  }, [q]);

  const mapUrlCandidate = selected?.photoUrl ?? (selected ? staticMapUrl({ lat: selected.lat, lng: selected.lng }) : null);
  const mapUrl = mapUrlCandidate && /^https?:\/\//i.test(mapUrlCandidate) ? mapUrlCandidate : null;

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => { 
          setQ(e.target.value); 
          handleChange(e.target.value); 
        }}
        placeholder="Dirección / Cancha o club"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={i}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => handleSelect(s)}
            >
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-gray-500">{s.address}</div>
            </button>
          ))}
        </div>
      )}
      {mapUrl && (
        <div className="mt-3">
          <img src={mapUrl} alt="Mapa del lugar" className="w-full h-40 object-cover rounded-lg" />
        </div>
      )}
    </div>
  );
}


