"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Calendar, CalendarCheck2, Gauge, MapPin, Search, Users } from "lucide-react";

import { FluidFilterDropdown } from "@/components/explore/FluidFilterDropdown";
import LevelBadge from "@/components/LevelBadge";
import { Button } from "@/components/ui/button";
import { MatchGridSkeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem } from "@/components/ui/page-transition";
import { comunasRM } from "@/lib/comunas-rm";
import { nivelES } from "@/lib/i18n";
import { useRoleGate } from "@/hooks/useRoleGate";

const POPULAR_COMUNAS = ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "La Florida"];

type MatchFilters = {
  comuna: string;
  from: string;
  to: string;
  level: string;
  page: number;
  pageSize: number;
};

export default function ExplorePage() {
  const { status } = useRoleGate({
    allow: ["player", "superadmin"],
    allowAnonymous: true,
    enforceLogout: true,
    message: "Cerramos tu sesión de cancha. Ingresa como jugador para explorar partidos y unirte a pichangas.",
  });
  const gateAllowed = status === "allowed";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MatchFilters>({ comuna: "", from: "", to: "", level: "", page: 1, pageSize: 24 });
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

  const endOfDayIso = useCallback((date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    normalized.setDate(normalized.getDate() + 1);
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
    if (!gateAllowed) return;
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
  }, [gateAllowed, pageSize, queryString, reloadToken]);

  useEffect(() => {
    if (!gateAllowed) return;
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
  }, [filters, gateAllowed]);

  const handleDateOptionChange = useCallback(
    (optionValue: string) => {
      if (optionValue === "") {
        setPendingCustomDate("");
        setFilters((f) => ({ ...f, from: "", to: "", page: 1 }));
        return;
      }

      if (optionValue === "today") {
        const startIso = startOfDayIso(today);
        const endIso = endOfDayIso(today);
        setPendingCustomDate(startIso.slice(0, 10));
        setFilters((f) => ({ ...f, from: startIso, to: endIso, page: 1 }));
        return;
      }

      if (optionValue === "tomorrow") {
        const startIso = startOfDayIso(tomorrow);
        const endIso = endOfDayIso(tomorrow);
        setPendingCustomDate(startIso.slice(0, 10));
        setFilters((f) => ({ ...f, from: startIso, to: endIso, page: 1 }));
        return;
      }

      if (optionValue === "custom") {
        if (pendingCustomDate) {
          const baseDate = new Date(`${pendingCustomDate}T00:00:00`);
          const startIso = startOfDayIso(baseDate);
          const endIso = endOfDayIso(baseDate);
          setFilters((f) => ({ ...f, from: startIso, to: endIso, page: 1 }));
        }
      }
    },
    [pendingCustomDate, setFilters, setPendingCustomDate, startOfDayIso, endOfDayIso, today, tomorrow],
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
        renderContent: ({ close }: { close: () => void }) => (
          <div className="space-y-3 text-sm" onMouseDown={(event) => event.stopPropagation()}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha personalizada</p>
              <p className="text-xs text-gray-500">Mostraremos partidos disponibles desde la fecha que elijas.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="date"
                value={pendingCustomDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setPendingCustomDate(value);
                  if (value) {
                    const baseDate = new Date(`${value}T00:00:00`);
                    const startIso = startOfDayIso(baseDate);
                    const endIso = endOfDayIso(baseDate);
                    setFilters((f) => ({ ...f, from: startIso, to: endIso, page: 1 }));
                  } else {
                    setFilters((f) => ({ ...f, from: "", to: "", page: 1 }));
                  }
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
              <Button
                type="button"
                onClick={() => {
                  if (pendingCustomDate) {
                    const baseDate = new Date(`${pendingCustomDate}T00:00:00`);
                    const startIso = startOfDayIso(baseDate);
                    const endIso = endOfDayIso(baseDate);
                    setFilters((f) => ({ ...f, from: startIso, to: endIso, page: 1 }));
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
                  setFilters((f) => ({ ...f, from: "", to: "", page: 1 }));
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
    [pendingCustomDate, today, startOfDayIso, endOfDayIso],
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
    setFilters({ comuna: "", from: "", to: "", level: "", page: 1, pageSize });
    setComunaSearch("");
    setShowAllComunas(false);
    setPendingCustomDate("");
    setReloadToken((t) => t + 1);
  }, [pageSize]);

  const handleRetry = useCallback(() => {
    setFilters((f) => ({ ...f, page: 1 }));
    setReloadToken((token) => token + 1);
  }, [setFilters, setReloadToken]);

  // Unified loading state: Show skeleton if auth is pending OR initial data is loading
  const showSkeleton = !gateAllowed || (loading && items.length === 0 && !fetchError);

  if (!gateAllowed && status === "denied") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center text-sm text-gray-600">
          <div className="h-10 w-10 rounded-full border-b-2 border-gray-800 animate-spin" />
          <p>Cerrando sesión de cuenta de cancha…</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-gray-50"
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
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

        {/* Unified Loading State - Skeleton */}
        {showSkeleton && (
          <MatchGridSkeleton count={8} />
        )}

        {/* Matches Grid with Staggered Animation */}
        {!showSkeleton && items.length > 0 && (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 xl:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {items.map((match, index) => {
                const rawFriendCount =
                  typeof match?.friendCount === "number" ? match.friendCount : Number(match?.friendCount ?? 0);
                const friendCount = Number.isFinite(rawFriendCount) ? rawFriendCount : 0;
                const friendNames = Array.isArray(match?.friendNames)
                  ? (match.friendNames as string[])
                    .map((name) => (typeof name === "string" ? name.trim() : ""))
                    .filter((name) => name.length > 0)
                  : [];
                let friendHeadline = "";
                let friendDescription = "";
                if (friendCount > 0) {
                  friendHeadline =
                    friendCount === 1 ? "Tu amigo ya confirmó su cupo" : `${friendCount} amigos ya confirmaron`;
                  if (friendCount === 1) {
                    friendDescription = friendNames[0]
                      ? `${friendNames[0]} ya está inscrito`
                      : "Hay un amigo jugando este partido.";
                  } else if (friendNames.length >= 2) {
                    const extra = friendCount - 2;
                    friendDescription =
                      extra > 0
                        ? `${friendNames[0]}, ${friendNames[1]} y ${extra} amigo${extra === 1 ? "" : "s"} más`
                        : `${friendNames[0]} y ${friendNames[1]}`;
                  } else if (friendNames.length === 1) {
                    const remaining = friendCount - 1;
                    friendDescription =
                      remaining > 0
                        ? `${friendNames[0]} y ${remaining} amigo${remaining === 1 ? "" : "s"} más`
                        : friendNames[0];
                  } else {
                    friendDescription = `${friendCount} amigo${friendCount === 1 ? "" : "s"} confirmado${friendCount === 1 ? "" : "s"}`;
                  }
                  if (!friendDescription) {
                    friendDescription = friendHeadline;
                  }
                }

                const showFriendDetails =
                  friendCount > 0 && friendDescription && friendDescription !== friendHeadline;

                return (
                  <motion.div
                    key={match.id}
                    variants={staggerItem}
                    layout
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  >
                    <Link
                      href={`/partidos/${match.id}`}
                      className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-cyan-300 block"
                    >
                      {/* Map Section with Overlay */}
                      <div className="relative h-48 w-full overflow-hidden">
                        <MiniMap lat={match.lat} lng={match.lng} title={match.title} id={match.id} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Content Section */}
                      <div className="relative space-y-4 p-5 sm:p-6">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden />
                            Oficial
                          </span>
                          <span className="text-xs font-medium text-gray-500">Cancha verificada</span>
                        </div>

                        {/* Title and Level */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="flex-1 text-lg sm:text-xl font-bold text-gray-900 transition-colors duration-200 group-hover:text-cyan-600 leading-tight">
                            {match.venueName ? `${match.title} - ${match.venueName}` : match.title}
                          </h3>
                          <LevelBadge level={match.level as keyof typeof nivelES} />
                        </div>

                        {/* Info Grid */}
                        <div className="space-y-3">
                          {/* Location */}
                          <div className="flex items-start gap-2.5 text-gray-600">
                            <MapPin className="mt-0.5 h-4 w-4 text-cyan-600 flex-shrink-0" />
                            <div className="flex flex-col leading-tight">
                              <span className="font-semibold text-gray-900">{match.venueName || 'Cancha'}</span>
                              <span className="text-sm text-gray-500">{match.comuna}</span>
                            </div>
                          </div>

                          {/* Date & Time */}
                          <div className="flex items-center gap-2.5 text-gray-600">
                            <Calendar className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              {new Intl.DateTimeFormat("es-CL", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(match.startsAt))}
                            </span>
                          </div>

                          {/* Players */}
                          <div className="flex items-center gap-2.5">
                            <Users className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {match.paid}/{match.totalSpots} cupos
                                </span>
                                {/* Progress Bar */}
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(match.paid / match.totalSpots) * 100}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {match.confirmed ? '✓ Partido confirmado' : `Se confirma con ${match.minSpotsToConfirm} jugadores`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Friends Section */}
                        {friendCount > 0 ? (
                          <motion.div
                            className="flex items-start gap-3 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-emerald-50 px-4 py-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
                              <Users className="h-4 w-4" />
                            </span>
                            <div className="space-y-0.5 text-sm">
                              <p className="font-bold text-cyan-700">{friendHeadline}</p>
                              {showFriendDetails ? (
                                <p className="text-xs text-gray-700">{friendDescription}</p>
                              ) : null}
                            </div>
                          </motion.div>
                        ) : null}

                        {/* Price and Availability */}
                        <div className="flex items-center justify-between border-t-2 border-gray-100 pt-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Precio</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                              {match.pricePerSpot > 0
                                ? new Intl.NumberFormat("es-CL", {
                                  style: "currency",
                                  currency: "CLP",
                                  maximumFractionDigits: 0,
                                }).format(match.pricePerSpot)
                                : "Gratis"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {match.available} disponibles
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
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

        {/* Loading More Indicator - Subtle */}
        {loading && items.length > 0 && (
          <motion.div
            className="py-8 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <motion.div
                className="flex gap-1"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: 0.15,
                      repeat: Infinity,
                    },
                  },
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-cyan-500 rounded-full"
                    variants={{
                      hidden: { opacity: 0.3, scale: 0.8 },
                      show: {
                        opacity: 1,
                        scale: 1,
                        transition: {
                          duration: 0.5,
                          ease: "easeInOut",
                        },
                      },
                    }}
                  />
                ))}
              </motion.div>
              <span>Cargando más partidos</span>
            </div>
          </motion.div>
        )}

        <div ref={loadMoreRef} />
      </main>
    </motion.div>
  );
}

