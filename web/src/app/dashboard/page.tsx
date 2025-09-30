"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Trophy, CheckCircle, Clock as ClockIcon } from "lucide-react";
import { sampleMatches } from "@/lib/samples";
import { useSearchParams, useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRoleGate } from "@/hooks/useRoleGate";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"organizer" | "player">("organizer");
  const [authOpen, setAuthOpen] = useState(false);
  const { user, loading } = useAuth();
  const { status } = useRoleGate({
    allow: ["player", "superadmin"],
    allowAnonymous: true,
    enforceLogout: true,
    message: "Cerramos tu sesión de cancha. Ingresa como jugador para revisar tu actividad y partidos.",
  });

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

  if (status !== "allowed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center text-sm text-gray-600">
          <div className="h-10 w-10 rounded-full border-b-2 border-gray-800 animate-spin" />
          <p>{status === "denied" ? "Cerrando sesión de cuenta de cancha…" : "Preparando tu dashboard..."}</p>
        </div>
      </div>
    );
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthDialog open={authOpen} onOpenChange={(o)=>{ setAuthOpen(o); if(!o) router.replace("/"); }} initialTab="login" next="/dashboard" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Mi Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => switchTab("organizer")}
              className={`px-6 py-4 font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === "organizer"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
              }`}
            >
              Como Organizador
            </button>
            <button
              onClick={() => switchTab("player")}
              className={`px-6 py-4 font-medium rounded-t-lg transition-all duration-200 ${
                activeTab === "player"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
              }`}
            >
              Como Jugador
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "organizer" ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organizados (90d)</p>
                    <p className="text-2xl font-bold text-black">{organizerData.metrics.totalOrganized}</p>
                  </div>
                </div>
              </div>
              
              {/* OcupaciÃ³n promedio eliminada por peticiÃ³n */}
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cupos confirmados</p>
                    <p className="text-2xl font-bold text-black">{organizerData.metrics.confirmedPlayers}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="text-2xl font-bold text-black">{organizerData.metrics.rating?.toFixed ? (organizerData.metrics.rating ?? 0).toFixed(1) : "0.0"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-black mb-6">Próximos Partidos</h2>
              <div className="space-y-4">
                {organizerData.nextMatch ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-xl">âš½</div>
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{organizerData.nextMatch.title}</h3>
                        <p className="text-sm text-gray-600">{new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(organizerData.nextMatch.startsAt))} â€¢ {organizerData.nextMatch.comuna}</p>
                        <p className="text-xs text-gray-500 mt-1">Mínimo {organizerData.nextMatch.minSpotsToConfirm || organizerData.nextMatch.totalSpots} jugadores - {organizerData.nextMatch.isConfirmed ? 'Confirmado' : `Faltan ${Math.max(0, (organizerData.nextMatch.minSpotsToConfirm || organizerData.nextMatch.totalSpots) - organizerData.nextMatch.paid)}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Cupos</p>
                        <p className="font-medium text-black">{organizerData.nextMatch.paid}/{organizerData.nextMatch.totalSpots}</p>
                      </div>
                      <Link href={`/match/${organizerData.nextMatch.id}`} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm">Ver Detalles</Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No tienes partidos próximos como organizador.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reservas confirmadas</p>
                    <p className="text-2xl font-bold text-black">{typeof playerData.metrics.upcomingCount !== 'undefined' ? playerData.metrics.upcomingCount : (playerData.nextMatch ? 1 : 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Próximo Partido</p>
                    <p className="text-2xl font-bold text-black">{playerData.nextMatch ? new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(new Date(playerData.nextMatch.startsAt)) : "â€”"}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Partidos Jugados</p>
                    <p className="text-2xl font-bold text-black">{playerData.metrics.playedCount ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Reservations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-black mb-6">Mis Reservas</h2>
              <div className="space-y-4">
                {playerData.nextMatch ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-xl">âš½</div>
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{playerData.nextMatch.title}</h3>
                        <p className="text-sm text-gray-600">{new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(playerData.nextMatch.startsAt))} â€¢ {playerData.nextMatch.comuna}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Costo</p>
                        <p className="font-medium text-green-600">Gratis</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Confirmado</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No tienes reservas activas.</div>
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

