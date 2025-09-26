"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Trophy, CheckCircle, Clock as ClockIcon } from "lucide-react";
import { sampleMatches } from "@/lib/samples";
import { useSearchParams, useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"organizer" | "player">("organizer");
  const [authOpen, setAuthOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
  }, [user, loading]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "jugador") setActiveTab("player");
    if (tabParam === "organizador") setActiveTab("organizer");
  }, [searchParams]);

  const switchTab = (tab: "organizer" | "player") => {
    setActiveTab(tab);
    const qp = new URLSearchParams(Array.from(searchParams.entries()));
    qp.set("tab", tab === "organizer" ? "organizador" : "jugador");
    router.replace(`/dashboard?${qp.toString()}`);
  };
  const [organizerData, setOrganizerData] = useState<any>({ nextMatch: null, metrics: { totalOrganized: 0, occupancy: 0, confirmedPlayers: 0, rating: 0 } });
  const [playerData, setPlayerData] = useState<any>({ nextMatch: null, metrics: { playedCount: 0, upcomingCount: 0 } });

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const [o, p] = await Promise.all([
          fetch("/api/dashboard/organizer", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
          fetch("/api/dashboard/player", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        ]);
        if (o?.metrics) setOrganizerData(o);
        if (p?.metrics) setPlayerData(p);
      } catch {}
    })();
  }, [user]);

  if (!user) return (
    <div className="min-h-screen bg-[color:var(--bg)] flex items-center justify-center">
      <AuthDialog open={authOpen} onOpenChange={(o)=>{ setAuthOpen(o); if(!o) router.replace("/"); }} initialTab="login" next="/dashboard" />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[color:var(--bg)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-brand/5 blur-[120px]" />
        <div className="absolute top-1/3 -left-32 h-72 w-72 rounded-full bg-[color:var(--brand-soft)] blur-[120px]" />
      </div>
      {/* Header */}
      <header className="border-b border-[color:var(--border)]/70 bg-white/75 shadow-[0_8px_30px_rgba(0,72,92,0.08)] backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-full p-2 text-[color:var(--fg)] transition-colors duration-200 hover:bg-white/70"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-[color:var(--fg)]">Mi Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[color:var(--border)]/70 bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex space-x-2">
            <button
              onClick={() => switchTab("organizer")}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === "organizer"
                  ? "bg-[color:var(--brand-1)] text-white shadow-brand"
                  : "text-[color:var(--fg-muted)] hover:bg-white/70 hover:text-[color:var(--brand-1)]"
              }`}
            >
              Como Organizador
            </button>
            <button
              onClick={() => switchTab("player")}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === "player"
                  ? "bg-[color:var(--brand-1)] text-white shadow-brand"
                  : "text-[color:var(--fg-muted)] hover:bg-white/70 hover:text-[color:var(--brand-1)]"
              }`}
            >
              Como Jugador
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {activeTab === "organizer" ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="card space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)]">
                    <Calendar className="h-6 w-6 text-[color:var(--brand-1)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[color:var(--fg-muted)]">Organizados (90d)</p>
                    <p className="text-2xl font-semibold text-[color:var(--fg)]">{organizerData.metrics.totalOrganized}</p>
                  </div>
                </div>
              </div>
              
              {/* OcupaciÃ³n promedio eliminada por peticiÃ³n */}
              
              <div className="card space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)]">
                    <Users className="h-6 w-6 text-[color:var(--brand-1)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[color:var(--fg-muted)]">Cupos confirmados</p>
                    <p className="text-2xl font-semibold text-[color:var(--fg)]">{organizerData.metrics.confirmedPlayers}</p>
                  </div>
                </div>
              </div>
              
              <div className="card space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/20">
                    <Trophy className="h-6 w-6 text-[color:var(--brand-1)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[color:var(--fg-muted)]">Rating</p>
                    <p className="text-2xl font-semibold text-[color:var(--fg)]">{organizerData.metrics.rating?.toFixed ? (organizerData.metrics.rating ?? 0).toFixed(1) : "0.0"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="card space-y-4 p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[color:var(--fg)]">Próximos partidos</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-[color:var(--brand-1)]">
                  Agenda viva
                </span>
              </div>
              <div className="space-y-4">
                {organizerData.nextMatch ? (
                  <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)]/70 bg-[color:var(--surface-strong)] px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/20 text-2xl">
                        <span className="text-[color:var(--brand-1)]">⚽</span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[color:var(--fg)]">{organizerData.nextMatch.title}</h3>
                        <p className="text-sm text-[color:var(--fg-muted)]">{new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(organizerData.nextMatch.startsAt))} • {organizerData.nextMatch.comuna}</p>
                        <p className="mt-1 text-xs text-[color:var(--fg-subtle)]">Mínimo {organizerData.nextMatch.minSpotsToConfirm || organizerData.nextMatch.totalSpots} jugadores · {organizerData.nextMatch.isConfirmed ? "Confirmado" : `Faltan ${Math.max(0, (organizerData.nextMatch.minSpotsToConfirm || organizerData.nextMatch.totalSpots) - organizerData.nextMatch.paid)}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-[color:var(--fg-subtle)]">Cupos</p>
                        <p className="text-lg font-semibold text-[color:var(--fg)]">{organizerData.nextMatch.paid}/{organizerData.nextMatch.totalSpots}</p>
                      </div>
                      <Link
                        href={`/match/${organizerData.nextMatch.id}`}
                        className="btn-primary btn-mobile-sm"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-white/60 px-4 py-6 text-sm text-[color:var(--fg-muted)]">
                    No tienes partidos próximos como organizador.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="card space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[color:var(--brand-soft)] rounded-lg">
                    <CheckCircle className="w-6 h-6 text-[color:var(--brand-1)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--fg-subtle)]">Reservas confirmadas</p>
                    <p className="text-2xl font-bold text-[color:var(--fg)]">{typeof playerData.metrics.upcomingCount !== 'undefined' ? playerData.metrics.upcomingCount : (playerData.nextMatch ? 1 : 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="card space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[color:var(--brand-soft)] rounded-lg">
                    <ClockIcon className="w-6 h-6 text-[color:var(--brand-1)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--fg-subtle)]">Próximo Partido</p>
                    <p className="text-2xl font-bold text-[color:var(--fg)]">{playerData.nextMatch ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(playerData.nextMatch.startsAt)) : "â€”"}</p>
                  </div>
                </div>
              </div>
              
              <div className="card space-y-3 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[color:var(--brand-soft)] rounded-lg">
                    <Trophy className="w-6 h-6 text-[color:var(--brand-1)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[color:var(--fg-subtle)]">Partidos Jugados</p>
                    <p className="text-2xl font-bold text-[color:var(--fg)]">{playerData.metrics.playedCount ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Reservations */}
            <div className="card space-y-4 p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-[color:var(--fg)]">Mis reservas</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-[color:var(--brand-1)]">
                  Participando
                </span>
              </div>
              <div className="space-y-4">
                {playerData.nextMatch ? (
                  <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)]/70 bg-[color:var(--surface-strong)] px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-brand/20 text-2xl">
                        <span className="text-[color:var(--brand-1)]">⚽</span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[color:var(--fg)]">{playerData.nextMatch.title}</h3>
                        <p className="text-sm text-[color:var(--fg-muted)]">{new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(playerData.nextMatch.startsAt))} • {playerData.nextMatch.comuna}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-[color:var(--fg-subtle)]">Costo</p>
                        <p className="text-lg font-semibold text-[color:var(--brand-1)]">Gratis</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-[color:var(--brand-1)]/30 bg-[color:var(--brand-soft)] px-3 py-1 text-[13px] font-semibold text-[color:var(--brand-1)]">
                        <CheckCircle className="h-4 w-4" />
                        Confirmado
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-white/60 px-4 py-6 text-sm text-[color:var(--fg-muted)]">
                    No tienes reservas activas.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--bg)] flex items-center justify-center">Cargando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

