"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { staticMapUrl } from "@/lib/maps";

type Suggestion = { 
  label: string; 
  address: string; 
  lat: number; 
  lng: number; 
  place_id?: string; 
  photoUrl?: string; 
  comuna?: string 
};

type Props = {
  value?: string;
  onChange?: (v: {
    venueName?: string;
    venueAddress?: string;
    lat?: number;
    lng?: number;
    display?: string;
    place_id?: string;
    photoUrl?: string;
    comuna?: string;
  }) => void;
  // Backward-compat alias used by older code
  onSelect?: (v: {
    venueName?: string;
    venueAddress?: string;
    lat?: number;
    lng?: number;
    display?: string;
    place_id?: string;
    photoUrl?: string;
    comuna?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export default function AddressAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Buscar dirección, lugar, comuna o punto de referencia...",
  className,
  inputClassName,
}: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [mustSelectHint, setMustSelectHint] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`, {
        signal: abortControllerRef.current.signal,
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = data.items || [];
      setSuggestions(items);
      setIsOpen(items.length > 0);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error buscando sugerencias:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!selectedSuggestion) {
      timeoutRef.current = setTimeout(() => {
        searchSuggestions(inputValue);
      }, 200); // más ágil
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputValue, selectedSuggestion, searchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setMustSelectHint(false);
    if (selectedSuggestion) {
      setSelectedSuggestion(null);
    }
    (onChange ?? onSelect)?.({ display: newValue });
  };

  const selectSuggestion = (s: Suggestion) => {
    setSelectedSuggestion(s);
    setInputValue(s.label);
    setIsOpen(false);
    setMustSelectHint(false);
    (onChange ?? onSelect)?.({
      venueName: s.label,
      venueAddress: s.address,
      lat: s.lat,
      lng: s.lng,
      display: s.label,
      place_id: s.place_id,
      photoUrl: s.photoUrl,
      comuna: s.comuna,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!selectedSuggestion) {
        e.preventDefault();
        // seleccionar automáticamente la primera sugerencia si existe
        if (suggestions.length > 0) {
          selectSuggestion(suggestions[0]);
        } else {
          setMustSelectHint(true);
        }
      }
    }
  };

  const handleBlur = () => {
    if (!selectedSuggestion) {
      // pedir selección cuando haya sugerencias
      if (suggestions.length > 0) setMustSelectHint(true);
    }
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.address-autocomplete')) setIsOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const mapUrl = selectedSuggestion
    ? (selectedSuggestion.photoUrl && selectedSuggestion.photoUrl.trim() !== ''
        ? selectedSuggestion.photoUrl
        : (staticMapUrl({ lat: selectedSuggestion.lat, lng: selectedSuggestion.lng }) || ""))
    : null;

  return (
    <div className={clsx("address-autocomplete relative", className)}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => { if (suggestions.length > 0 && !selectedSuggestion) setIsOpen(true); }}
        placeholder={placeholder}
        className={clsx(
          "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200",
          selectedSuggestion ? "border-green-500 bg-green-50" : "border-gray-300",
          inputClassName,
        )}
      />

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">🔍 Buscando lugares...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => selectSuggestion(s)}
              >
                <div className="text-sm font-medium text-black truncate">{s.label}</div>
                <div className="text-xs text-gray-600 truncate">{s.address}</div>
                {s.comuna && (
                  <div className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <span>📍</span><span>{s.comuna}</span>
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No se encontraron lugares. Intenta con otros términos.
            </div>
          )}
        </div>
      )}

      {mustSelectHint && !selectedSuggestion && (
        <p className="mt-2 text-xs text-red-600">Selecciona una dirección de la lista para continuar.</p>
      )}

      {mapUrl && (
        <div className="mt-3">
          <img
            src={mapUrl}
            alt="Vista previa del lugar"
            className="w-full h-40 object-cover rounded-lg"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}

// Exportar lista de posiciones para reuso
export const AVAILABLE_POSITIONS = [
  { key: "ARQUERO", label: "Arquero" },
  { key: "DEFENSA", label: "Defensa" },
  { key: "LATERAL", label: "Lateral" },
  { key: "MEDIOCAMPISTA", label: "Mediocampista" },
  { key: "EXTREMO", label: "Extremo" },
  { key: "DELANTERO", label: "Delantero" },
];


