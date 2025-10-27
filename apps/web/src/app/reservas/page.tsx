"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, MapPin, MessageSquare } from "lucide-react";

interface InboxMatch {
  id: string;
  title: string;
  comuna?: string | null;
  startsAt: string;
  venueName?: string | null;
  upcoming: boolean;
}

export default function ReservasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [matches, setMatches] = useState<InboxMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    setLoadingMatches(true);
    (async () => {
      try {
        const res = await fetch("/api/messages/inbox", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "No pudimos cargar tus reservas");
        setMatches(Array.isArray(data?.matches) ? (data.matches as InboxMatch[]) : []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No pudimos cargar tus reservas";
        setError(message);
      } finally {
        setLoadingMatches(false);
      }
    })();
  }, [user]);

  const { upcoming, past } = useMemo(() => {
    const upcomingMatches = matches.filter((match) => match.upcoming);
    const pastMatches = matches.filter((match) => !match.upcoming);
    upcomingMatches.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    pastMatches.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    return { upcoming: upcomingMatches, past: pastMatches };
  }, [matches]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <AuthDialog
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open);
            if (!open) router.replace("/");
          }}
          initialTab="login"
          next="/reservas"
        />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Mis reservas</h1>
          <p className="text-sm text-gray-600">
            Revisa los partidos en los que tienes cupo confirmado y accede a la conversación del equipo.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
        ) : null}

        <section className="mb-10">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Próximos partidos</h2>
            <Link href="/explorar" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              Buscar nuevas pichangas
            </Link>
          </header>
          {loadingMatches ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">Cargando tus reservas…</div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Aún no tienes partidos próximos. Explora nuevas pichangas y reserva tu cupo.
            </div>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((match) => (
                <li key={match.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{match.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(match.startsAt)} · {formatTime(match.startsAt)}
                        </span>
                        {match.venueName ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {match.venueName}
                          </span>
                        ) : null}
                        {match.comuna ? <span className="text-gray-500">{match.comuna}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/match/${match.id}`}
                        className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/match/${match.id}/chat`}
                        className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Abrir chat
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Historial reciente</h2>
          {loadingMatches ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">Cargando…</div>
          ) : past.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
              Cuando juegues tus partidos aparecerán aquí para que puedas revisar resultados y dejar comentarios.
            </div>
          ) : (
            <ul className="space-y-3">
              {past.slice(0, 6).map((match) => (
                <li key={match.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{match.title}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(match.startsAt)}</span>
                        {match.comuna ? <span>{match.comuna}</span> : null}
                      </div>
                    </div>
                    <Link
                      href={`/match/${match.id}`}
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-gray-400 md:mt-0"
                    >
                      Revisar partido
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}
