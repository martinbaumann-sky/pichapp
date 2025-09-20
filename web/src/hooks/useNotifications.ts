"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface NotificationItem {
  id: string;
  type:
    | "friend_request_incoming"
    | "friend_request_accepted"
    | "match_starting_player"
    | "match_starting_organizer"
    | "match_full_player"
    | "match_full_organizer"
    | "waitlist_invite";
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const initialLoad = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      if (initialLoad.current) setLoading(true);
      const res = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
      const data = (await res.json()) as NotificationsResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[useNotifications]", err);
      setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones");
    } finally {
      initialLoad.current = false;
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (controllerRef.current) controllerRef.current.abort();
      setItems([]);
      setUnreadCount(0);
      setLoading(false);
      initialLoad.current = true;
      return;
    }

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 60000);

    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [enabled, fetchNotifications]);

  return {
    items,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
  };
}
