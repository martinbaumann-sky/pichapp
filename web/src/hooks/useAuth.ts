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
      const response = await fetch("/api/auth/local/session", { cache: "no-store" });
      const data = await response.json();
      setUser(data.user);
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
    } catch (error) {
      console.error("[AUTH] Error signing out:", error);
    }
  }, []);

  return { user, loading, signOut, checkSession };
}
