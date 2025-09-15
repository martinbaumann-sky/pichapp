"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/Avatar";

export default function MatchChatPage(props: any) {
  // In client components use `useParams` to read route params
  const routeParams = useParams() as { id: string } | null;
  const id = routeParams?.id ?? (props.params?.id ?? "");
  const cacheKey = `chat:${id}`;
  const { user, loading } = useAuth();
  const [restricted, setRestricted] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      // Prefer cached messages first to avoid UI flicker
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setMessages(parsed);
        }
      } catch {}

      const res = await fetch(`/api/messages?matchId=${id}`, { cache: "no-store", credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        const next = data.items ?? [];
        setMessages(() => next);
        try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
        setRestricted(false);
        setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
      } else {
        if (res.status === 403) {
          setRestricted(true);
          setMessages([]);
          return;
        }
        try {
          const err = await res.json();
          console.error("GET /api/messages failed:", res.status, err);
          setError(err?.error || "Error al cargar mensajes");
        } catch {
          console.error("GET /api/messages failed (non-json)", res.status);
          setError("Error al cargar mensajes");
        }
        setTimeout(() => setError(null), 3000);
      }
    })();
  }, [id]);

  // realtime removed in simple auth implementation

  // Auto-scroll when messages change
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
  }, [messages.length]);

  // Persist messages so chat survives navigation between tabs/pages
  useEffect(() => {
    try { localStorage.setItem(cacheKey, JSON.stringify(messages)); } catch {}
  }, [messages, cacheKey]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (loading) return;
    if (!user) {
      setError("Debes iniciar sesión para enviar mensajes");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (restricted) {
      setError("Solo participantes del partido pueden enviar mensajes");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      matchId: id,
      senderId: user?.id || null,
      sender: { id: user?.id, name: user?.name || "Tú" },
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: "sending",
    } as any;

    // Optimistic UI
    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");

    try {
      if (!id) {
        setError("ID de partido no disponible");
        setTimeout(() => setError(null), 3000);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return;
      }

      const body = { matchId: id, text: trimmed };
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
      if (!res.ok) {
        let parsed: any = {};
        try { parsed = await res.json(); } catch { parsed = { text: await res.text() }; }
        console.error("POST /api/messages failed:", res.status, parsed);
        // mark optimistic message as failed
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: "failed" } : m)));
        setError(parsed?.error || parsed?.text || "Error al enviar mensaje");
        setTimeout(() => setError(null), 5000);
        return;
      }
      const data = await res.json();

      // Replace optimistic message with server-created message
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data.message : m)));

      // Realtime broadcast omitido en este flujo simplificado
    } catch (err: any) {
      // Mark optimistic message as failed and show error
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? { ...m, status: "failed" } : m)));
      setError(err?.message || "Error al enviar mensaje");
      setTimeout(() => setError(null), 5000);
    }
  };

  const retryMessage = async (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    // try resend
    try {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: "sending" } : m)));
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: id, text: msg.text }), credentials: "same-origin" });
      if (!res.ok) {
        const parsed = await res.json().catch(() => ({ text: "Error" }));
        throw new Error(parsed?.error || parsed?.text || "Error al reenviar mensaje");
      }
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === msgId ? data.message : m)));
    } catch (e: any) {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: "failed" } : m)));
      setError(e?.message || "Error al reenviar mensaje");
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Chat del partido</h1>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div ref={listRef} className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">Aún no hay mensajes.</div>
          )}
          {messages.map((m) => {
            const isMine = user && m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <div className="mr-3">
                    <Avatar name={m.sender?.name ?? "J"} size={36} />
                  </div>
                )}
                <div className={`max-w-[75%] p-3 rounded-lg ${isMine ? "bg-black text-white rounded-br-none" : "bg-gray-100 text-gray-900 rounded-bl-none"}`}>
                  <div className="text-sm font-medium mb-1">{m.sender?.name ?? (isMine ? "Tú" : "Jugador")}</div>
                  <div className={`text-sm break-words whitespace-pre-wrap ${String(m.id).startsWith("temp-") ? "opacity-70 italic" : ""}`}>{m.text}</div>
                  <div className="flex items-center justify-end gap-2">
                    <div className="text-[11px] text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</div>
                    {m.status === "sending" && <div className="text-[11px] text-gray-500">Enviando…</div>}
                    {m.status === "failed" && (
                      <button onClick={() => retryMessage(m.id)} className="text-[11px] text-red-600 underline">Reintentar</button>
                    )}
                  </div>
                </div>
                {isMine && (
                  <div className="ml-3">
                    <Avatar name={user?.name ?? "T"} size={36} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t flex gap-2 items-center">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="flex-1 border rounded-xl px-4 py-2 resize-none h-10"
            placeholder="Escribe un mensaje (Enter para enviar, Shift+Enter nueva línea)"
          />
          <button onClick={send} className="px-4 py-2 bg-black text-white rounded-full">Enviar</button>
        </div>
      </div>
    </div>
  );
}

