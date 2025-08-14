"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Trophy, CheckCircle, Clock as ClockIcon } from "lucide-react";
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
  const matches = sampleMatches();

  const organizerMatches = matches.slice(0, 2);
  const playerMatches = matches.slice(1, 3);

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
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Partidos Activos</p>
                    <p className="text-2xl font-bold text-black">{organizerMatches.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Cupos</p>
                    <p className="text-2xl font-bold text-black">
                      {organizerMatches.reduce((acc, m) => acc + m.totalSpots, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ingresos</p>
                    <p className="text-2xl font-bold text-black">
                      ${organizerMatches.reduce((acc, m) => acc + (m.pricePerSpot * m.spots.filter(s => s.status === "PAID").length), 0).toLocaleString("es-CL")}
                    </p>
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
                    <p className="text-2xl font-bold text-black">4.8</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-black mb-6">Próximos Partidos</h2>
              <div className="space-y-4">
                {organizerMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-xl">⚽</div>
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{match.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Intl.DateTimeFormat("es-CL", { 
                            weekday: "short", 
                            day: "numeric", 
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          }).format(new Date(match.startsAt))} • {match.comuna}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Cupos</p>
                        <p className="font-medium text-black">
                          {match.spots.filter(s => s.status === "PAID").length}/{match.totalSpots}
                        </p>
                      </div>
                       <Link
                        href={`/match/${match.id}`}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reservas Activas</p>
                    <p className="text-2xl font-bold text-black">{playerMatches.length}</p>
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
                    <p className="text-2xl font-bold text-black">2h</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Gastado</p>
                    <p className="text-2xl font-bold text-black">
                      ${playerMatches.reduce((acc, m) => acc + m.pricePerSpot, 0).toLocaleString("es-CL")}
                    </p>
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
                    <p className="text-2xl font-bold text-black">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Reservations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-black mb-6">Mis Reservas</h2>
              <div className="space-y-4">
                {playerMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-xl">⚽</div>
                      </div>
                      <div>
                        <h3 className="font-medium text-black">{match.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Intl.DateTimeFormat("es-CL", { 
                            weekday: "short", 
                            day: "numeric", 
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          }).format(new Date(match.startsAt))} • {match.comuna}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Precio</p>
                        <p className="font-medium text-green-600">
                          ${match.pricePerSpot.toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Confirmado</span>
                      </div>
                    </div>
                  </div>
                ))}
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

