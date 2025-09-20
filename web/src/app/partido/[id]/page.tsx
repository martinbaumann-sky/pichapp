"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import AddFriendButton from "@/components/AddFriendButton";
import type { FriendStatus } from "@/lib/friendship";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle, Share2, MessageSquare, Trash2 } from "lucide-react";
import MatchHeroMap from "@/components/MatchHeroMap";
import { nivelES, posicionES } from "@/lib/i18n";
import { sampleMatches } from "@/lib/samples";

export default function MatchDetailPage(props: any) {
  const FALLBACK_IMG = "https://images.unsplash.com/photo-1505842465776-3d7a1ee1a8b7?q=80&w=1200&auto=format&fit=crop";
  const routeParams = useParams() as any;
  const id = routeParams?.id as string;
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const loadMatch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMatch(data);
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
  }, [id]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`/api/matches/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "No se pudo confirmar el cupo");
      }
      const successMessage = data?.message || (data?.alreadyJoined ? "Ya estabas inscrito en este partido." : "Cupo confirmado. Nos vemos en la cancha.");
      setToast(successMessage);
      setTimeout(() => setToast(null), 3000);
      await loadMatch();
    } catch (e: any) {
      const msg = e?.message ?? "No se pudo confirmar el cupo";
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async () => {
    if (!match?.viewer?.canDelete || deleting) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Estas seguro de eliminar este partido? Esta accion no se puede deshacer.");
      if (!confirmed) return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/matches/${id}`, { method: "DELETE", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar el partido");
      }
      const msg = data?.message || "Partido eliminado correctamente";
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
      setTimeout(() => {
        router.replace("/explorar");
      }, 600);
    } catch (e: any) {
      const msg = e?.message ?? "No se pudo eliminar el partido";
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: match?.title ?? "PichangApp", url });
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
  const viewer = match.viewer ?? null;
  const isOrganizer = viewer?.isOrganizer || (user && match && (user.id === (match.organizerId ?? match.organizer?.id)));
  const canOpenChat = !!(viewer?.hasJoined || isOrganizer);
  const organizerFriendship = match.organizerFriendship ?? { status: 'NONE', friendId: null };
  const initialFriendStatus = (organizerFriendship.status ?? 'NONE') as FriendStatus;

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/explorar" className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Detalle del Partido</h1>
            <div className="ml-auto flex items-center gap-2">
              {viewer?.canDelete ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span>{deleting ? "Eliminando..." : "Eliminar"}</span>
                  </div>
                </button>
              ) : null}
              <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Hero map: muestra la ubicacion grande del partido */}
          {match ? (
            <MatchHeroMap lat={match.lat} lng={match.lng} title={match.title} />
          ) : (
            <div className="h-64 w-full bg-gray-100" />
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-black mb-2">{match.venueName ? `${match.title} - ${match.venueName}` : match.title}</h2>
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
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">ULTIMOS CUPOS</span>
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
                    <p className="text-sm text-gray-500">Duracion</p>
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
                  <div>
                    <p className="text-sm text-gray-500">Costo por cupo</p>
                    <p className="font-medium text-green-600">{match.pricePerSpot > 0 ? new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(match.pricePerSpot) : "Gratis"}</p>
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

            {(() => {
              if (canOpenChat) {
                return (
                  <Link href={`/match/${id}/chat`} className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200">
                    <MessageSquare className="w-5 h-5" />
                    Abrir chat
                  </Link>
                );
              }
              if (!isFull) {
                return (
                  <div className="space-y-3">
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className="w-full px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {joining
                        ? "Confirmando..."
                        : match.pricePerSpot > 0
                          ? `Tomar Cupo - ${new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(match.pricePerSpot)}`
                          : "Tomar Cupo Gratis"}
                    </button>
                  </div>
                );
              }
              return (
                <div className="w-full px-8 py-4 bg-gray-200 text-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Partido Completo
                </div>
              );
            })()}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-black mb-4">Organizacion</h3>
          {match.organizer ? (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-gray-700">Organiza:</span>
              <Link href={`/usuarios/${match.organizer.id}`} className="font-medium text-black underline-offset-4 hover:underline">
                {match.organizer.name}
              </Link>
              {organizerFriendship ? (
                <AddFriendButton
                  targetId={match.organizer.id}
                  targetName={match.organizer.name}
                  initialStatus={initialFriendStatus}
                  initialFriendId={organizerFriendship.friendId ?? null}
                  size="sm"
                />
              ) : null}
            </div>
          ) : null}
          <div className="mt-4">
            <h4 className="font-semibold text-black mb-2">Jugadores confirmados</h4>
            <ul className="space-y-2">
              {(match.players ?? []).map((p: any, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{p.displayName ?? p.user?.name ?? `Jugador ${idx+1}`}</span>
                    {/* Mostrar posicion preferida: si viene en user.profile usar eso, sino usar spot.position si existe */}
                    {((p.user && p.user.position) || p.position) && (
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">{posicionES[(p.user?.position ?? p.position) as keyof typeof posicionES]}</span>
                    )}
                    {p.team && (
                      <span className={`text-xs px-2 py-1 rounded ${p.team === 'CLARO' ? 'bg-yellow-50 text-yellow-800' : 'bg-slate-800 text-white'}`}> {p.team === 'CLARO' ? 'Claro' : 'Oscuro'}</span>
                    )}
                  </div>
                  <div className="text-gray-500">{p.status === "PAID" ? "Confirmado" : "Reservado"}</div>
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

