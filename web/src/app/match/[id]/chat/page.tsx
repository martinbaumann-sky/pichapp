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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">⚽</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat del Partido</h1>
            <p className="text-sm text-gray-500">Conecta con todos los participantes del partido</p>
          </div>
        </div>
      </div>

      {/* Contenedor principal del chat */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Área de mensajes */}
        <div ref={listRef} className="h-[65vh] overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-500 text-lg font-medium">Aún no hay mensajes</p>
              <p className="text-gray-400 text-sm">¡Sé el primero en escribir algo!</p>
            </div>
          )}
          
          {messages.map((m) => {
            const isMine = user && m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                <div className={`flex items-end space-x-3 max-w-[80%] ${isMine ? "flex-row-reverse space-x-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${isMine ? "ml-3" : "mr-3"}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-md">
                      <Avatar name={m.sender?.name ?? (isMine ? "T" : "J")} size={40} />
                    </div>
                  </div>
                  
                  {/* Burbuja de mensaje */}
                  <div className="flex flex-col space-y-1">
                    {/* Nombre del remitente */}
                    {!isMine && (
                      <div className="text-xs font-medium text-gray-600 px-1">
                        {m.sender?.name ?? "Jugador"}
                      </div>
                    )}
                    
                    {/* Contenido del mensaje */}
                    <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                      isMine 
                        ? "bg-gradient-to-br from-brand to-accent text-white rounded-br-md" 
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-md hover:shadow-md"
                    }`}>
                      <div className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        String(m.id).startsWith("temp-") ? "opacity-70 italic" : ""
                      }`}>
                        {m.text}
                      </div>
                      
                      {/* Indicadores de estado */}
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <div className={`text-xs ${
                          isMine ? "text-white/80" : "text-gray-400"
                        }`}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          }) : ""}
                        </div>
                        
                        {m.status === "sending" && (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        )}
                        
                        {m.status === "failed" && (
                          <button 
                            onClick={() => retryMessage(m.id)} 
                            className="text-xs text-red-300 hover:text-red-200 underline transition-colors"
                          >
                            Reintentar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Área de entrada mejorada */}
        <div className="p-4 bg-white border-t border-gray-100">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === "Enter" && !e.shiftKey) { 
                    e.preventDefault(); 
                    send(); 
                  } 
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200 placeholder-gray-400"
                placeholder="Escribe tu mensaje aquí..."
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            
            <button 
              onClick={send} 
              disabled={!text.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-brand to-accent text-white rounded-2xl font-medium hover:from-brand-600 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="flex items-center space-x-2">
                <span>Enviar</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-400 text-center">
            Presiona Enter para enviar • Shift + Enter para nueva línea
          </div>
        </div>
      </div>
    </div>
  );
}

