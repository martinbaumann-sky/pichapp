"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock, Loader2, RefreshCw, Users } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

interface VenueMatch {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  totalSpots: number;
  pricePerSpot: number;
  venueName?: string | null;
  venueAddress?: string | null;
  paidSpots: number;
  reservedSpots: number;
}

interface VenueDashboardResponse {
  matches: VenueMatch[];
  venue?: { name: string } | null;
}

interface LoadOptions {
  withSpinner?: boolean;
}

export default function VenueMatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<VenueMatch[]>([]);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVenue = user?.role === "venue_admin" || user?.role === "superadmin";

  useEffect(() => {
    if (!authLoading && !isVenue) {
      router.replace("/");
    }
  }, [authLoading, isVenue, router]);

  const loadMatches = useCallback(
    async ({ withSpinner = false }: LoadOptions = {}) => {
      if (withSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const response = await fetch("/api/venue/dashboard", { cache: "no-store" });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "No pudimos cargar tus partidos");
        }
        const payload = (await response.json()) as VenueDashboardResponse;
        setMatches(payload.matches ?? []);
        setVenueName(payload.venue?.name ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error inesperado";
        setError(message);
      } finally {
        if (withSpinner) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!authLoading && isVenue) {
      loadMatches({ withSpinner: true });
    }
  }, [authLoading, isVenue, loadMatches]);

  const { activeMatches, historicalMatches } = useMemo(() => {
    const now = Date.now();
    const active: VenueMatch[] = [];
    const historical: VenueMatch[] = [];

    matches.forEach((match) => {
      const startsAt = new Date(match.startsAt).getTime();
      const normalized = match.status.toLowerCase();
      const isHistorical = startsAt < now || normalized === "finished" || normalized === "canceled";
      if (isHistorical) {
        historical.push(match);
      } else {
        active.push(match);
      }
    });

    active.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    historical.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

    return { activeMatches: active, historicalMatches: historical };
  }, [matches]);

  const handleRefresh = () => {
    if (refreshing || loading) return;
    loadMatches({ withSpinner: false });
  };

  if (!isVenue) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const showInitialSpinner = loading && !refreshing;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container container-px py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Panel de cancha</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Mis partidos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Consulta y administra los partidos activos e históricos de tu cancha.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualizar
            </button>
            <Link
              href="/panel/cancha/partidos/nuevo"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Crear partido
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {showInitialSpinner ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            <MatchSection
              title="Partidos activos"
              emptyMessage="Aún no tienes partidos publicados en curso."
              matches={activeMatches}
              venueName={venueName}
            />
            <MatchSection
              title="Historial"
              emptyMessage="Aquí verás los partidos que ya finalizaron o fueron cancelados."
              matches={historicalMatches}
              venueName={venueName}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MatchSection({
  title,
  matches,
  venueName,
  emptyMessage,
}: {
  title: string;
  matches: VenueMatch[];
  venueName: string | null;
  emptyMessage: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {matches.length} {matches.length === 1 ? "partido" : "partidos"}
        </span>
      </div>
      {matches.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} venueName={venueName} />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({ match, venueName }: { match: VenueMatch; venueName: string | null }) {
  const location = match.venueAddress || match.venueName || venueName || "Ubicación por confirmar";
  const paidCount = match.paidSpots;
  const reservedCount = match.reservedSpots;

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{match.title}</h3>
            <MatchStatusPill status={match.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{location}</p>
        </div>
        <Link
          href={`/match/${match.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Ver detalle
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <dl className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          <span>{formatDateTime(match.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{formatTime(match.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span>
            {paidCount} pagados · {reservedCount} reservados · {match.totalSpots} cupos
          </span>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
          Precio {formatCurrency(match.pricePerSpot)}
        </span>
      </div>
    </article>
  );
}

const statusStyles: Record<string, { label: string; className: string }> = {
  published: { label: "Publicado", className: "bg-emerald-100 text-emerald-700" },
  full: { label: "Completo", className: "bg-blue-100 text-blue-700" },
  pending: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  canceled: { label: "Cancelado", className: "bg-red-100 text-red-700" },
  finished: { label: "Finalizado", className: "bg-gray-200 text-gray-700" },
  default: { label: "En curso", className: "bg-gray-100 text-gray-700" },
};

function MatchStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const style = statusStyles[normalized] ?? statusStyles.default;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
