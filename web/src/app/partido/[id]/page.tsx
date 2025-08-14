"use client";

import { useState, useEffect, use } from "react";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, AlertCircle, Share2, ImageIcon } from "lucide-react";
import { nivelES, posicionES } from "@/lib/i18n";
import { sampleMatches } from "@/lib/samples";

export default function MatchDetailPage(props: any) {
  const params = use(props.params);
  const { id } = params as { id: string };
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/matches/${id}`, { cache: "no-store" });
        const paidParam = new URL(window.location.href).searchParams.get("paid");
        if (res.ok) {
          const data = await res.json();
          setMatch(data);
          if (paidParam === "1") {
            setToast("Pago confirmado. Cupo tomado.");
            setTimeout(() => setToast(null), 3000);
          } else if (paidParam === "0") {
            setToast("Pago pendiente o rechazado.");
            setTimeout(() => setToast(null), 3000);
          }
        } else {
          const fallback = sampleMatches().find((m: any) => m.id === id);
          if (fallback) {
            setMatch({
              ...fallback,
              paid: fallback.spots.filter((s: any) => s.status === "PAID").length,
              available: fallback.spots.filter((s: any) => s.status === "AVAILABLE").length,
            });
          }
        }
      } catch (error) {
        const fallback = sampleMatches().find((m: any) => m.id === id);
        if (fallback) {
          setMatch({
            ...fallback,
            paid: fallback.spots.filter((s: any) => s.status === "PAID").length,
            available: fallback.spots.filter((s: any) => s.status === "AVAILABLE").length,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  const handleJoin = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await fetch(`/api/matches/${id}/join`, { method: "POST" });
      if (!res.ok) throw new Error("No se pudo reservar");
      const data = await res.json();
      const url = data.init_point || data.checkoutUrl;
      if (url) window.location.href = url;
    } catch (e) {
      setToast("Error al reservar. Intenta nuevamente.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: match?.title ?? "PichApp", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setToast("Link copiado");
      setTimeout(() => setToast(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Partido no encontrado</h1>
          <Link href="/explorar" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200">
            Volver a partidos
          </Link>
        </div>
      </div>
    );
  }

  const isFull = match.available === 0;
  const isAlmostFull = match.available <= 2;

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/explorar" className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Detalle del Partido</h1>
            <button onClick={handleShare} className="ml-auto p-2 hover:bg-gray-100 rounded-lg">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {match.coverImageUrl ? (
            <img src={match.coverImageUrl} alt={match.title} className="h-64 w-full object-cover" />
          ) : (
            <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-black mb-2">{match.venueName ? `${match.title} — ${match.venueName}` : match.title}</h2>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{match.comuna}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    match.level === "BEGINNER"
                      ? "bg-green-100 text-green-800"
                      : match.level === "INTERMEDIATE"
                      ? "bg-yellow-100 text-yellow-800"
                      : match.level === "ADVANCED"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {nivelES[match.level as keyof typeof nivelES]}
                </span>

                {isFull && (
                  <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">COMPLETO</span>
                )}

                {isAlmostFull && !isFull && (
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">ÚLTIMOS CUPOS</span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha y hora</p>
                    <p className="font-medium text-black">
                      {new Intl.DateTimeFormat("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(match.startsAt))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Duración</p>
                    <p className="font-medium text-black">{match.durationMins ?? 90} minutos</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Cupos</p>
                    <p className="font-medium text-black">{match.paid}/{match.totalSpots} ocupados</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Precio por cupo</p>
                    <p className="font-medium text-green-600">{new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(match.pricePerSpot)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Estado del partido</span>
                <span className="text-sm text-gray-500">{match.available} cupos disponibles</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(match.paid / match.totalSpots) * 100}%` }} />
              </div>
            </div>

            {!isFull ? (
              <button onClick={handleJoin} className="w-full px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Tomar Cupo - {new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(match.pricePerSpot)}
              </button>
            ) : (
              <div className="w-full px-8 py-4 bg-gray-200 text-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Partido Completo
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-black mb-4">Organización</h3>
          {match.organizer ? (
            <p className="text-gray-700 mb-4">Organiza: <span className="font-medium">{match.organizer.name}</span></p>
          ) : null}
          <div className="mt-4">
            <h4 className="font-semibold text-black mb-2">Jugadores confirmados</h4>
            <ul className="space-y-2">
              {(match.players ?? []).map((p: any, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-center justify-between">
                  <span>{p.user?.name ?? "Jugador"}</span>
                  <span className="text-gray-500">{p.status === "PAID" ? (p.user?.position ? posicionES[p.user.position as keyof typeof posicionES] : "") : "Reservado"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>
      )}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialTab="login" next={`/match/${id}`}/>
    </div>
  );
}

