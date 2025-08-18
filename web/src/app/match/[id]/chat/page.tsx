"use client";

import { use, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getBrowserSupabase } from "@/lib/supabase";

export default function MatchChatPage(props: any) {
  const params = use(props.params) as { id: string };
  const { id } = params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/messages?matchId=${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.items ?? []);
        setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
      }
    })();
  }, [id]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = (supabase as any).channel(`match:${id}`);
    channel.on("broadcast", { event: "msg" }, (payload: any) => {
      const m = payload?.payload?.message;
      if (m) {
        setMessages((prev) => [...prev, m]);
        setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 20);
      }
    });
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [id]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const body = { matchId: id, text: trimmed };
    setText("");
    const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      const supabase = getBrowserSupabase();
      try {
        (supabase as any)?.channel(`match:${id}`)?.send({ type: "broadcast", event: "msg", payload: { message: data.message } });
      } catch {}
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 20);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Chat del partido</h1>
      <div ref={listRef} className="h-[60vh] overflow-y-auto bg-white border rounded-lg p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <div className="text-sm text-gray-800">{m.text}</div>
            <div className="text-[11px] text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">Aún no hay mensajes.</div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send(); }} className="flex-1 border rounded-lg px-3 py-2" placeholder="Escribe un mensaje" />
        <button onClick={send} className="px-4 py-2 bg-black text-white rounded-lg">Enviar</button>
      </div>
    </div>
  );
}


