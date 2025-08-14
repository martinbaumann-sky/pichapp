"use client";

import { useEffect } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

type Props = { children: React.ReactNode };

export default function SupabaseProvider({ children }: Props) {
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log("[AUTH] event", event);
        await fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, session }),
        });
      } catch {}
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  return children as any;
}


