"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, Filter, MapPin, Users } from "lucide-react";

import FullPageSpinner from "@/components/FullPageSpinner";
import LevelBadge from "@/components/LevelBadge";
import { comunasRM } from "@/lib/comunas-rm";
import { nivelES } from "@/lib/i18n";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1505842465776-3d7a1ee1a8b7?q=80&w=1200&auto=format&fit=crop";

interface MatchItem {
  id: string | number;
  available: number;
  comuna: string;
  coverImageUrl?: string;
  confirmed?: boolean;
  lat?: number;
  lng?: number;
  level: string;
  minSpotsToConfirm?: number;
  paid: number;
  pricePerSpot: number;
  startsAt: string;
  title: string;
  totalSpots: number;
  venueName?: string;
}

export interface MatchFilters {
  comuna: string;
  from: string;
  level: string;
  page: number;
  pageSize: number;
}

interface MatchesPageClientProps {
  initialItems: MatchItem[];
  initialFilters: MatchFilters;
}

export default function MatchesPageClient({ initialItems, initialFilters }: MatchesPageClientProps) {
  const [items, setItems] = useState<MatchItem[]>(initialItems);
  const [filters, setFilters] = useState<MatchFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const shouldSkipNextFetch = useRef(true);

  useEffect(() => {
    setItems(initialItems);
    setFilters(initialFilters);
    shouldSkipNextFetch.current = true;
  }, [initialFilters, initialItems]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value === "" || value == null) return;
      params.set(key, String(value));
    });

    return params.toString();
  }, [filters]);

  useEffect(() => {
    if (shouldSkipNextFetch.current) {
      shouldSkipNextFetch.current = false;
      return;
    }

    const controller = new AbortController();
    const url = queryString ? `/api/matches?${queryString}` : "/api/matches";

    setLoading(true);

    fetch(url, { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to load matches", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    if (typeof window !== "undefined") {
      const newUrl = queryString ? `/explorar?${queryString}` : "/explorar";
      window.history.replaceState(null, "", newUrl);
    }

    return () => controller.abort();
  }, [queryString]);

  const handleFilterChange = useCallback(
    <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  if (loading) {
    return <FullPageSpinner className="bg-gray-50 text-gray-700" message="Buscando partidos disponibles" />;
  }

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Explorar Partidos</h1>
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2 md:col-span-1">
              <Filter className="w-4 h-4" />
              <span className="text-sm text-gray-600">Filtros</span>
            </div>
            <select
              value={filters.comuna}
              onChange={(event) => handleFilterChange("comuna", event.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Todas las comunas</option>
              {comunasRM.map((comuna) => (
                <option key={comuna} value={comuna}>
                  {comuna}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.from ? new Date(filters.from).toISOString().slice(0, 10) : ""}
              onChange={(event) =>
                handleFilterChange(
                  "from",
                  event.target.value ? new Date(`${event.target.value}T00:00:00`).toISOString() : ""
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <select
              value={filters.level}
              onChange={(event) => handleFilterChange("level", event.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Todos los niveles</option>
              {Object.entries(nivelES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500 md:text-right md:col-span-1">
              Reservar es gratis durante este lanzamiento.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleFilterChange("page", Math.max(1, Number(filters.page) - 1))}
                className="px-3 py-2 text-sm border rounded-lg"
              >
                Anterior
              </button>
              <button
                onClick={() => handleFilterChange("page", Number(filters.page) + 1)}
                className="px-3 py-2 text-sm border rounded-lg"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((match) => (
            <Link
              key={match.id}
              href={`/partidos/${match.id}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="h-48 w-full rounded-b-none bg-gray-100"
                style={{
                  backgroundImage: `url("${String(
                    (() => {
                      const maybe = match.coverImageUrl;
                      const isUrl = typeof maybe === "string" && /^https?:\/\//i.test(maybe);
                      if (isUrl) return maybe;
                      if (match.lat != null && match.lng != null)
                        return `https://staticmap.openstreetmap.de/staticmap.php?center=${match.lat},${match.lng}&zoom=17&size=800x400&markers=${match.lat},${match.lng},red`;
                      return FALLBACK_IMG;
                    })()
                  ).replace(/"/g, "%22")}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                role="img"
                aria-label={match.title}
              />

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-black group-hover:text-gray-700 transition-colors duration-200">
                    {match.venueName ? `${match.title} — ${match.venueName}` : match.title}
                  </h3>
                  <LevelBadge level={match.level as keyof typeof nivelES} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{match.comuna}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Intl.DateTimeFormat("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(match.startsAt))}
                    </span>
                  </div>

                  <div className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {match.paid}/{match.totalSpots} cupos ocupados
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 pl-6">
                      {match.confirmed
                        ? "Partido confirmado"
                        : `Se confirma con ${match.minSpotsToConfirm} jugadores`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-green-600 font-semibold">
                    <span>
                      {match.pricePerSpot > 0
                        ? new Intl.NumberFormat("es-CL", {
                            style: "currency",
                            currency: "CLP",
                            maximumFractionDigits: 0,
                          }).format(match.pricePerSpot)
                        : "Gratis"}
                    </span>
                  </div>

                  <span className="text-sm text-gray-500">{match.available} disponibles</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {items.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-gray-700 mb-2 font-semibold">No encontramos partidos publicados aún.</p>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Sigue a tus canchas favoritas y activa las notificaciones para enterarte primero cuando abran cupos.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/explorar" className="px-6 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-gray-800">
                Explorar otras comunas
              </Link>
              <Link
                href="/reservas"
                className="px-6 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-400"
              >
                Revisar mis reservas
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

