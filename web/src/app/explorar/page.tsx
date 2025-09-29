"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CalendarCheck2, Filter, Gauge, MapPin, Search, Users } from "lucide-react";

import { FluidFilterDropdown } from "@/components/explore/FluidFilterDropdown";
import LevelBadge from "@/components/LevelBadge";
import { Button } from "@/components/ui/button";
import { comunasRM } from "@/lib/comunas-rm";
import { nivelES } from "@/lib/i18n";

const POPULAR_COMUNAS = ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "La Florida"];

type MatchFilters = {
  comuna: string;
  from: string;
  level: string;
  page: number;
  pageSize: number;
};

export default function ExplorePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchFilters>({ comuna: "", from: "", level: "", page: 1, pageSize: 24 });
  const [comunaSearch, setComunaSearch] = useState("");
  const [showAllComunas, setShowAllComunas] = useState(false);
  const [pendingCustomDate, setPendingCustomDate] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  const lastSuccessfulItemsRef = useRef<any[]>([]);
  const MiniMap = dynamic(() => import("@/components/MatchMiniMap"), { ssr: false });

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const startOfDayIso = useCallback((date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString();
  }, []);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const tomorrow = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today]);

  const dateOption = useMemo(() => {
    if (!filters.from) return "";
    const current = new Date(filters.from);
    current.setHours(0, 0, 0, 0);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(current, today)) return "today";
    if (isSameDay(current, tomorrow)) return "tomorrow";
    return "custom";
  }, [filters.from, today, tomorrow]);

  useEffect(() => {
    if (!filters.from) {
      setPendingCustomDate("");
      return;
    }
    const parsed = new Date(filters.from);
    if (Number.isNaN(parsed.getTime())) {
      setPendingCustomDate("");
      return;
    }
    setPendingCustomDate(parsed.toISOString().slice(0, 10));
  }, [filters.from]);

  const pageSize = filters.pageSize;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page: 1 }).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMatches() {
      setLoading(true);
      setFetchError(null);
      setHasMore(true);
      const previousItems = lastSuccessfulItemsRef.current;
      setItems(previousItems.length > 0 ? previousItems : []);

      const url = queryString ? `/api/matches?${queryString}` : "/api/matches";

      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        const list = Array.isArray(data.items) ? data.items : [];
        lastSuccessfulItemsRef.current = list;
        setItems(list);
        setHasMore(list.length >= pageSize);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.error("No se pudieron cargar los partidos", error);
        setFetchError("No pudimos cargar los partidos. Revisa tu conexión e inténtalo nuevamente.");
        setHasMore(lastSuccessfulItemsRef.current.length >= pageSize);
        setItems(lastSuccessfulItemsRef.current);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMatches();

    return () => controller.abort();
  }, [queryString, pageSize, reloadToken]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    let pendingController: AbortController | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting || loadingRef.current || !hasMoreRef.current) {
          return;
        }

        const nextPage = (filters.page as number) + 1;
        const params = new URLSearchParams();
        Object.entries({ ...filters, page: nextPage }).forEach(([key, value]) => {
          if (value !== "" && value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });
        const url = `/api/matches?${params.toString()}`;
        const controller = new AbortController();
        pendingController?.abort();
        pendingController = controller;

        setLoading(true);
        setFetchError(null);

        fetch(url, { cache: "no-store", signal: controller.signal })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((data) => {
            if (controller.signal.aborted) return;
            const list = Array.isArray(data.items) ? data.items : [];
            setItems((prev) => {
              const next = [...prev, ...list];
              lastSuccessfulItemsRef.current = next;
              return next;
            });
            setHasMore(list.length >= filters.pageSize);
            setFilters((prev) => ({ ...prev, page: nextPage }));
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            // eslint-disable-next-line no-console
            console.error("Error al cargar más partidos", error);
            setFetchError("Tuvimos un problema al cargar más partidos. Intenta nuevamente.");
            setHasMore(false);
            setItems(lastSuccessfulItemsRef.current);
          })
          .finally(() => {
            if (!controller.signal.aborted) {
              setLoading(false);
            }
          });
      },
      { rootMargin: "400px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (pendingController) {
        pendingController.abort();
      }
    };
  }, [filters]);

  const handleDateOptionChange = useCallback(
    (optionValue: string) => {
      if (optionValue === "") {
        setPendingCustomDate("");
        setFilters((f) => ({ ...f, from: "", page: 1 }));
        return;
      }

      if (optionValue === "today") {
        const iso = startOfDayIso(today);
        setPendingCustomDate(iso.slice(0, 10));
        setFilters((f) => ({ ...f, from: iso, page: 1 }));
        return;
      }

      if (optionValue === "tomorrow") {
        const iso = startOfDayIso(tomorrow);
        setPendingCustomDate(iso.slice(0, 10));
        setFilters((f) => ({ ...f, from: iso, page: 1 }));
        return;
      }

      if (optionValue === "custom") {
        if (pendingCustomDate) {
          const iso = new Date(`${pendingCustomDate}T00:00:00`).toISOString();
          setFilters((f) => ({ ...f, from: iso, page: 1 }));
        }
      }
    },
    [pendingCustomDate, setFilters, setPendingCustomDate, startOfDayIso, today, tomorrow],
  );

  const dateOptions = useMemo(
    () => [
      {
        value: "",
        label: "Cualquier fecha",
        description: "Partidos disponibles sin restricción",
        icon: CalendarCheck2,
        accent: "bg-emerald-100 text-emerald-700",
      },
      {
        value: "today",
        label: "Hoy",
        description: "Encuentra partidos para las próximas horas",
        icon: Calendar,
        accent: "bg-sky-100 text-sky-700",
      },
      {
        value: "tomorrow",
        label: "Mañana",
        description: "Asegura tu cupo con anticipación",
        icon: Calendar,
      },
      {
        value: "custom",
        label: pendingCustomDate ? `Desde ${new Date(`${pendingCustomDate}T00:00:00`).toLocaleDateString("es-CL")}` : "Elegir fecha",
        description: "Define una fecha específica",
        icon: Calendar,
        renderContent: ({ close }) => (
          <div className="space-y-3 text-sm" onMouseDown={(event) => event.stopPropagation()}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha personalizada</p>
              <p className="text-xs text-gray-500">Mostraremos partidos disponibles desde la fecha que elijas.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="date"
                value={pendingCustomDate}
                onChange={(event) => setPendingCustomDate(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
              <Button
                type="button"
                onClick={() => {
                  if (pendingCustomDate) {
                    const iso = new Date(`${pendingCustomDate}T00:00:00`).toISOString();
                    setFilters((f) => ({ ...f, from: iso, page: 1 }));
                    close();
                  }
                }}
                className="h-10 rounded-lg bg-black px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900"
              >
                Aplicar filtro
              </Button>
            </div>
            <div className="flex justify-between gap-2 text-xs text-gray-500">
              <button
                type="button"
                className="font-medium text-gray-600 underline-offset-4 hover:underline"
                onClick={() => {
                  setPendingCustomDate("");
                  setFilters((f) => ({ ...f, from: "", page: 1 }));
                  close();
                }}
              >
                Quitar filtro
              </button>
              <span>Horario de referencia: {today.toLocaleDateString("es-CL")}</span>
            </div>
          </div>
        ),
      },
    ],
    [pendingCustomDate, today],
  );

  const comunaData = useMemo(() => {
    const normalized = comunaSearch.trim().toLowerCase();
    const all = normalized
      ? comunasRM.filter((comuna) => comuna.toLowerCase().includes(normalized))
      : comunasRM;
    const shouldLimit = !normalized && !showAllComunas;
    const visible = shouldLimit ? all.slice(0, 12) : all;
    const hiddenCount = all.length - visible.length;

    const options = [
      {
        value: "",
        label: "Toda la RM",
        description: "Explora partidos en todas las comunas",
        icon: MapPin,
        accent: "bg-cyan-100 text-cyan-700",
      },
      ...visible.map((comuna) => ({
        value: comuna,
        label: comuna,
        description: "Partidos organizados en esta comuna",
        icon: MapPin,
      })),
    ];

    return { options, hiddenCount };
  }, [comunaSearch, showAllComunas]);

  const levelOptions = useMemo(() => {
    const base = [
      {
        value: "",
        label: "Todos los niveles",
        description: "Muestra partidos abiertos para cualquier nivel",
        icon: Gauge,
        accent: "bg-amber-100 text-amber-700",
      },
    ];

    const levels = Object.entries(nivelES).map(([value, label]) => ({
      value,
      label,
      description: `Jugadores nivel ${label.toLowerCase()}`,
      icon: Gauge,
    }));

    return [...base, ...levels];
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ comuna: "", from: "", level: "", page: 1, pageSize });
    setComunaSearch("");
    setShowAllComunas(false);
    setPendingCustomDate("");
    setReloadToken((t) => t + 1);
  }, [pageSize]);

  const handleRetry = useCallback(() => {
    setFilters((f) => ({ ...f, page: 1 }));
    setReloadToken((token) => token + 1);
  }, [setFilters, setReloadToken]);

  return (
    <motion.div
      className="bg-gray-50"
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
    >
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <Link
            href="/"
            className="rounded-lg p-2 transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 touch-target"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Explorar</p>
            <h1 className="text-xl sm:text-2xl font-bold text-black">Encuentra tu próximo partido</h1>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="relative z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm rounded-b-3xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-5 px-4 sm:px-5 lg:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                <Filter className="h-3.5 w-3.5" />
                Filtros inteligentes
              </div>
              <p className="max-w-2xl text-sm text-gray-500">
                Ajusta la ubicación, fecha y nivel para descubrir partidos que se ajusten a tu energía del día.
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 shadow-sm">
              Nos encontramos en beta: todas las reservas están disponibles sin costo durante este lanzamiento.
            </div>
          </div>

          <div className="grid gap-2 sm:gap-2.5 lg:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <FluidFilterDropdown
              label="Comuna"
              value={filters.comuna}
              onValueChange={(value) => {
                setFilters((f) => ({ ...f, comuna: value, page: 1 }));
                setComunaSearch("");
                setShowAllComunas(false);
              }}
              options={comunaData.options}
              listClassName="max-h-[260px]"
              renderTopSlot={({ close }) => (
                <div className="space-y-3" onMouseDown={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/10">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar comuna"
                      value={comunaSearch}
                      onChange={(event) => setComunaSearch(event.target.value)}
                      className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                    />
                    {comunaSearch ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-gray-400 hover:text-gray-600"
                        onClick={() => setComunaSearch("")}
                      >
                        Limpiar
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Populares</span>
                    {POPULAR_COMUNAS.map((comuna) => (
                      <button
                        key={comuna}
                        type="button"
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-white"
                        onClick={() => {
                          setFilters((f) => ({ ...f, comuna, page: 1 }));
                          setComunaSearch("");
                          setShowAllComunas(false);
                          close();
                        }}
                      >
                        {comuna}
                      </button>
                    ))}
                  </div>
                  {comunaData.hiddenCount > 0 && comunaSearch.trim().length === 0 ? (
                    <button
                      type="button"
                      className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-100/60 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-400 hover:bg-gray-100"
                      onClick={() => setShowAllComunas((prev) => !prev)}
                    >
                      {showAllComunas
                        ? "Mostrar menos comunas"
                        : `Ver ${comunaData.hiddenCount} comunas más`}
                    </button>
                  ) : null}
                </div>
              )}
            />

            <FluidFilterDropdown
              label="Fecha"
              value={dateOption}
              onValueChange={handleDateOptionChange}
              options={dateOptions}
              listClassName="max-h-[240px]"
            />

            <FluidFilterDropdown
              label="Nivel"
              value={filters.level}
              onValueChange={(value) => {
                setFilters((f) => ({ ...f, level: value, page: 1 }));
              }}
              options={levelOptions}
              listClassName="max-h-[240px]"
            />

            {/** Removed live update info block as requested */}
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 xl:px-12 pt-2 pb-6 sm:pt-2 lg:pt-4 xl:pt-6">
        {fetchError && items.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 sm:px-6 py-8 sm:py-10 text-center text-red-600">
            <p className="text-base sm:text-lg font-semibold">{fetchError}</p>
            <p className="mt-2 text-sm text-red-500">Revisa tu conexión o inténtalo nuevamente en unos segundos.</p>
            <Button
              type="button"
              onClick={handleRetry}
              className="mt-4 sm:mt-5 btn-primary btn-mobile"
            >
              Reintentar carga
            </Button>
          </div>
        ) : null}

        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 xl:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((match) => (
              <Link
                key={match.id}
                href={`/partidos/${match.id}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-48 w-full">
                  <MiniMap lat={match.lat} lng={match.lng} title={match.title} id={match.id} />
                </div>

                <div className="space-y-3 sm:space-y-4 lg:space-y-5 p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                      Oficial
                    </span>
                    <span className="font-medium normal-case text-gray-500">Cancha verificada</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 lg:gap-3">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-black transition-colors duration-200 group-hover:text-gray-700 leading-tight">
                      {match.venueName ? `${match.title} - ${match.venueName}` : match.title}
                    </h3>
                    <LevelBadge level={match.level as keyof typeof nivelES} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="mt-0.5 h-4 w-4" />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium">{match.venueName || 'Cancha'}</span>
                        <span className="text-sm text-gray-500">{match.comuna}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
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
                        <Users className="h-4 w-4" />
                        <span>
                          {match.paid}/{match.totalSpots} cupos ocupados
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 pl-6">
                        {match.confirmed ? 'Partido confirmado' : `Se confirma con ${match.minSpotsToConfirm} jugadores`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <div className="font-semibold text-green-600">
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
        )}

        {items.length === 0 && !loading && !fetchError && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Aún no hay partidos con estos filtros</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Ajusta la comuna, la fecha o el nivel para descubrir nuevas pichangas. También puedes seguir tus canchas favoritas para recibir notificaciones apenas publiquen.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
              >
                Limpiar filtros
              </button>
              <Link
                href="/reservas"
                className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Ver mis próximas reservas
              </Link>
            </div>
          </div>
        )}

        {fetchError && items.length > 0 && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span>{fetchError}</span>
            <button
              type="button"
              className="ml-3 font-semibold underline-offset-4 hover:underline"
              onClick={handleRetry}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading && (
          <div className="py-10 text-center text-gray-500">
            {items.length > 0 ? "Cargando más partidos…" : "Cargando…"}
          </div>
        )}

        <div ref={loadMoreRef} />
      </main>
    </motion.div>
  );
}

