"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, ShieldCheck } from "lucide-react";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

interface PlayerDashboardResponse {
  nextMatch: {
    id: string;
    title: string;
    comuna: string;
    startsAt: string;
    pricePerSpot: number;
  } | null;
  metrics: {
    playedCount: number;
    upcomingCount: number;
  };
}

export default function ReservasPage() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [data, setData] = useState<PlayerDashboardResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    setError(null);
    fetch("/api/dashboard/player", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No pudimos cargar tus reservas");
        const json = (await response.json()) as PlayerDashboardResponse;
        setData(json);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <AuthDialog
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open);
            if (!open) window.location.href = "/";
          }}
          initialTab="login"
          next="/reservas"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Reservas</p>
            <h1 className="text-3xl font-bold text-gray-900">Tus partidos confirmados</h1>
            <p className="mt-2 text-sm text-gray-600">Revisa próximos partidos, historial y actualiza tus datos de asistencia.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>{data?.metrics.upcomingCount ?? 0} reservas activas</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Próxima reserva</h2>
              <span className="text-xs uppercase tracking-wide text-gray-400">Modo jugador</span>
            </div>
            {data?.nextMatch ? (
              <div className="mt-5 space-y-4">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Intl.DateTimeFormat("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(data.nextMatch.startsAt))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{data.nextMatch.comuna}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Valor reservado: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(data.nextMatch.pricePerSpot || 0)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/partido/${data.nextMatch.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Ver detalles del partido
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-6 text-sm text-gray-600">
                <p className="font-semibold text-gray-800">Aún no tienes partidos confirmados.</p>
                <p className="mt-2">Explora nuevas pichangas y reserva tu cupo en segundos.</p>
                <Link href="/explorar" className="mt-4 inline-flex text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4">
                  Buscar partidos disponibles
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Resumen rápido</h2>
            <dl className="mt-5 grid grid-cols-1 gap-4 text-sm text-gray-600">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <dt className="font-semibold text-gray-800">Partidos jugados</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">{data?.metrics.playedCount ?? 0}</dd>
                <p className="mt-1 text-xs text-gray-500">Confirma asistencia después de cada pichanga para mejorar tus recomendaciones.</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <dt className="font-semibold text-gray-800">Reservas activas</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">{data?.metrics.upcomingCount ?? 0}</dd>
                <p className="mt-1 text-xs text-gray-500">Recibirás recordatorios automáticos 24 horas antes del partido.</p>
              </div>
            </dl>
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-white/70 p-4 text-xs text-gray-500">
              <p>
                ¿Organizas partidos frecuentemente? Activa el modo organizador desde tu <Link href="/dashboard?tab=organizador" className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4">Panel</Link> para publicar pichangas oficiales.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {fetching && (
          <div className="text-sm text-gray-500">Actualizando tus reservas…</div>
        )}
      </main>
    </div>
  );
}
