"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Filter, ImageIcon } from "lucide-react";
import { comunasRM } from "@/lib/comunas-rm";
import { nivelES } from "@/lib/i18n";

export default function ExplorePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [filters, setFilters] = useState({ comuna: "", from: "", level: "", maxPrice: "", page: 1, pageSize: 24 });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page: 1 }).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    return params.toString();
  }, [filters.comuna, filters.from, filters.level, filters.maxPrice, filters.pageSize]);

  // Load first page on filter change
  useEffect(() => {
    const url = queryString ? `/api/matches?${queryString}` : "/api/matches";
    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = data.items ?? [];
        setItems(list);
        setHasMore(list.length >= (filters.pageSize as number));
      })
      .finally(() => setLoading(false));
    if (typeof window !== "undefined") {
      const newUrl = queryString ? `/explorar?${queryString}` : "/explorar";
      window.history.replaceState(null, "", newUrl);
    }
  }, [queryString]);

  // Infinite scroll: observe sentinel
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const el = loadMoreRef.current;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && !loading && hasMore) {
        const nextPage = (filters.page as number) + 1;
        const params = new URLSearchParams();
        Object.entries({ ...filters, page: nextPage }).forEach(([k, v]) => {
          if (v) params.set(k, String(v));
        });
        const url = `/api/matches?${params.toString()}`;
        setLoading(true);
        fetch(url, { cache: "no-store" })
          .then((r) => r.json())
          .then((data) => {
            const list = data.items ?? [];
            setItems((prev) => [...prev, ...list]);
            setHasMore(list.length >= (filters.pageSize as number));
            // keep current page for next load
            setFilters((f) => ({ ...f, page: nextPage }));
          })
          .finally(() => setLoading(false));
      }
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMoreRef, filters, hasMore, loading]);

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-150 hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Explorar Partidos</h1>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2 md:col-span-1">
              <Filter className="w-4 h-4" />
              <span className="text-sm text-gray-600">Filtros</span>
            </div>
            <select
              value={filters.comuna}
              onChange={(e) => setFilters((f) => ({ ...f, comuna: e.target.value, page: 1 }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value ? new Date(e.target.value + "T00:00:00").toISOString() : "", page: 1 }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <select
              value={filters.level}
              onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value, page: 1 }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Todos los niveles</option>
              {Object.entries(nivelES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              placeholder="Max $"
              inputMode="numeric"
              value={filters.maxPrice}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value, page: 1 }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((match) => (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
            >
              {/* Match Image */}
              {match.coverImageUrl ? (
                <img loading="lazy" src={match.coverImageUrl} alt={match.title} className="h-48 w-full object-cover rounded-b-none" />
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Match Info */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-black group-hover:text-gray-700 transition-colors duration-200">
                    {match.venueName ? `${match.title} — ${match.venueName}` : match.title}
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {nivelES[match.level as keyof typeof nivelES]}
                  </span>
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
                        minute: "2-digit"
                      }).format(new Date(match.startsAt))}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{match.paid}/{match.totalSpots} cupos ocupados</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>{new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(match.pricePerSpot)}</span>
                  </div>
                  
                  <span className="text-sm text-gray-500">
                    {match.available} disponibles
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {items.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">No hay partidos para mostrar.</p>
            <Link href="/organizar" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
              Organizar partido
            </Link>
          </div>
        )}
        {loading && (
          <div className="text-center py-10 text-gray-500">Cargando…</div>
        )}
        <div ref={loadMoreRef} />
      </main>
    </div>
  );
}


