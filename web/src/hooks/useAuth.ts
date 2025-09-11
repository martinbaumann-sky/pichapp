"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  comuna: string;
  position?: string;
  isAdmin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
      // Proteger contra respuestas HTML u otras no-JSON
      const text = await response.text();
      try {
        const data = text ? JSON.parse(text) : { user: null };
        setUser(data.user ?? null);
      } catch (e) {
        // Si viene HTML (p. ej. página de error), evitar JSON.parse y setear null
        console.warn('[AUTH] /api/auth/session returned non-json response');
        setUser(null);
      }
    } catch (error) {
      console.error("[AUTH] Error checking session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/local/signout", { method: "POST" });
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("[AUTH] Error signing out:", error);
    }
  }, []);

  return { user, loading, signOut, checkSession };
}
