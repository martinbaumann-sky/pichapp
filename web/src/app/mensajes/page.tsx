"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, RefreshCw, ArrowUpRight, Clock } from "lucide-react";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";

interface MessageThread {
  matchId: string;
  title: string;
  comuna: string | null;
  startsAt: string;
  isOrganizer: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderName: string | null;
}

export default function MensajesPage() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = () => {
    if (!user) return;
    setFetching(true);
    setError(null);
    fetch("/api/messages/threads", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudieron cargar tus conversaciones");
        const json = await response.json();
        setThreads(Array.isArray(json?.threads) ? (json.threads as MessageThread[]) : []);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    loadThreads();
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
          next="/mensajes"
        />
      </div>
    );
  }

  const formatDate = (value: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Mensajes</p>
            <h1 className="text-3xl font-bold text-gray-900">Conversaciones de tus partidos</h1>
            <p className="mt-2 text-sm text-gray-600">Coordina detalles con organizadores y jugadores sin salir de PichangApp.</p>
          </div>
          <button
            type="button"
            onClick={loadThreads}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        {threads.length === 0 && !fetching ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-8 text-center text-sm text-gray-600 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <MessageCircle className="h-6 w-6" />
            </div>
            <p className="mt-4 font-semibold text-gray-900">No tienes mensajes aún.</p>
            <p className="mt-2">Cuando participes en una pichanga podrás escribir y recibir novedades del organizador en esta sección.</p>
            <Link href="/explorar" className="mt-4 inline-flex text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4">
              Buscar partidos para jugar
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <div
                key={thread.matchId}
                className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{thread.title}</h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      {thread.isOrganizer ? "Organizas este partido" : "Tu reserva"}
                    </p>
                  </div>
                  <Link
                    href={`/partido/${thread.matchId}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black"
                  >
                    Abrir detalle
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Próximo encuentro: {formatDate(thread.startsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span>
                      {thread.lastMessage
                        ? `${thread.lastSenderName ? `${thread.lastSenderName}: ` : ""}${thread.lastMessage}`
                        : "Todavía no hay mensajes"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Última actualización: {thread.lastMessageAt ? formatDate(thread.lastMessageAt) : "Sin actividad"}
                  </span>
                  <Link
                    href={`/partido/${thread.matchId}#chat`}
                    className="font-semibold text-gray-900 underline decoration-gray-300 underline-offset-4"
                  >
                    Ir al chat del partido
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {fetching && (
          <div className="text-sm text-gray-500">Sincronizando conversaciones…</div>
        )}
      </main>
    </div>
  );
}
