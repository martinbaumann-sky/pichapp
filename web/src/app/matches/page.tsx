"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, Filter, ImageIcon } from "lucide-react";
import { comunasRM } from "@/lib/comunas-rm";
import { nivelES } from "@/lib/i18n";
import LevelBadge from "@/components/LevelBadge";

export default function MatchesPage() {
  const FALLBACK_IMG = "https://images.unsplash.com/photo-1505842465776-3d7a1ee1a8b7?q=80&w=1200&auto=format&fit=crop";
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({ comuna: "", from: "", level: "", page: 1, pageSize: 24 });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const url = queryString ? `/api/matches?${queryString}` : "/api/matches";
    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
    if (typeof window !== "undefined") {
      const newUrl = queryString ? `/explorar?${queryString}` : "/explorar";
      window.history.replaceState(null, "", newUrl);
    }
  }, [queryString]);

  return (
    <div className="bg-[color:var(--bg)]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-white/70 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-[color:var(--fg)]">Explorar Partidos</h1>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2 md:col-span-1">
              <Filter className="w-4 h-4" />
              <span className="text-sm text-[color:var(--fg-muted)]">Filtros</span>
            </div>
            <select
              value={filters.comuna}
              onChange={(e) => setFilters((f) => ({ ...f, comuna: e.target.value }))}
              className="px-3 py-2 border border-[color:var(--border)]/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-1)] focus:border-transparent"
            >
              <option value="">Todas las comunas</option>
              {comunasRM.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.from ? new Date(filters.from).toISOString().slice(0,10) : ""}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value ? new Date(e.target.value + "T00:00:00").toISOString() : "" }))}
              className="px-3 py-2 border border-[color:var(--border)]/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-1)] focus:border-transparent"
            />
            <select
              value={filters.level}
              onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
              className="px-3 py-2 border border-[color:var(--border)]/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-1)] focus:border-transparent"
            >
              <option value="">Todos los niveles</option>
              {Object.entries(nivelES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <div className="text-sm text-[color:var(--fg-subtle)] md:text-right md:col-span-1">
              Reservar es gratis durante este lanzamiento.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, Number(f.page) - 1) }))} className="px-3 py-2 text-sm border rounded-lg">Anterior</button>
              <button onClick={() => setFilters((f) => ({ ...f, page: Number(f.page) + 1 }))} className="px-3 py-2 text-sm border rounded-lg">Siguiente</button>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((match) => (
            <Link
              key={match.id}
              href={`/partido/${match.id}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-[color:var(--border)] overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
            >
              {/* Match Image */}
              <div
                className="h-48 w-full rounded-b-none bg-[color:var(--bg-subtle)]"
                style={{
                  backgroundImage: `url("${String((() => {
                    const maybe = match.coverImageUrl;
                    const isUrl = typeof maybe === "string" && /^https?:\/\//i.test(maybe);
                    if (isUrl) return maybe;
                    if (match.lat != null && match.lng != null) return `https://staticmap.openstreetmap.de/staticmap.php?center=${match.lat},${match.lng}&zoom=17&size=800x400&markers=${match.lat},${match.lng},red`;
                    return FALLBACK_IMG;
                  })()).replace(/"/g, "%22")}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                role="img"
                aria-label={match.title}
              />
              
              {/* Match Info */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-[color:var(--fg)] group-hover:text-[color:var(--fg)] transition-colors duration-200">
                    {match.venueName ? `${match.title} — ${match.venueName}` : match.title}
                  </h3>
                  <LevelBadge level={match.level as keyof typeof nivelES} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[color:var(--fg-muted)]">
                    <MapPin className="w-4 h-4" />
                    <span>{match.comuna}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[color:var(--fg-muted)]">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Intl.DateTimeFormat("es-CL", { 
                        weekday: "long", 
                        day: "numeric", 
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      }).format(new Date(match.startsAt))}
                    </span>
                  </div>
                  
                  <div className="text-[color:var(--fg-muted)]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{match.paid}/{match.totalSpots} cupos ocupados</span>
                    </div>
                    <p className="text-xs text-[color:var(--fg-subtle)] pl-6">{match.confirmed ? 'Partido confirmado' : `Se confirma con ${match.minSpotsToConfirm} jugadores`}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-[color:var(--border)]/70">
                  <div className="text-[color:var(--brand-1)] font-semibold">
                    <span>{match.pricePerSpot > 0 ? new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(match.pricePerSpot) : "Gratis"}</span>
                  </div>
                  
                  <span className="text-sm text-[color:var(--fg-subtle)]">
                    {match.available} disponibles
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {items.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-[color:var(--fg-muted)] mb-4">No hay partidos para mostrar.</p>
            <Link href="/organizar" className="px-6 py-3 bg-[color:var(--brand-1)] text-white rounded-lg hover:bg-brand-600">
              Organizar partido
            </Link>
          </div>
        )}
        {loading && (
          <div className="text-center py-10 text-[color:var(--fg-subtle)]">Cargando…</div>
        )}
      </main>
    </div>
  );
}
