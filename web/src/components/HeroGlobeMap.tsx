"use client";

import { useEffect, useRef } from "react";

type FocusPoint = { lat: number; lng: number } | null;

type Props = {
  focus: FocusPoint;
  activated: boolean;
};

function ensureLeafletLoaded(): Promise<typeof import("leaflet")> {
  return new Promise((resolve, reject) => {
    const existing = (globalThis as any).L as typeof import("leaflet") | undefined;
    if (existing) {
      resolve(existing);
      return;
    }

    if (!document.querySelector("link[data-leaflet]")) {
      const link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("data-leaflet", "1");
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-leaflet]");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const lib = (globalThis as any).L as typeof import("leaflet") | undefined;
        if (lib) resolve(lib);
      }, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.setAttribute("data-leaflet", "1");
    script.onload = () => {
      const lib = (globalThis as any).L as typeof import("leaflet") | undefined;
      if (lib) resolve(lib);
    };
    script.onerror = (event) => reject(event);
    document.body.appendChild(script);
  });
}

export default function HeroGlobeMap({ focus, activated }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const lastFocusRef = useRef<FocusPoint>(null);

  useEffect(() => {
    let cancelled = false;
    ensureLeafletLoaded()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          dragging: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
        });
        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        map.setView([10, -20], 2.4);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activated) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.touchZoom.enable?.();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.touchZoom.disable?.();
    }
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timeout);
  }, [activated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activated) return;
    if (!focus) return;
    const sameAsLast =
      lastFocusRef.current &&
      Math.abs(lastFocusRef.current.lat - focus.lat) < 0.0001 &&
      Math.abs(lastFocusRef.current.lng - focus.lng) < 0.0001;
    if (sameAsLast) return;
    lastFocusRef.current = focus;
    try {
      map.flyTo([focus.lat, focus.lng], 12, { duration: 1.4, easeLinearity: 0.25 });
    } catch {
      map.setView([focus.lat, focus.lng], 12);
    }
  }, [focus, activated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activated) return;
    if (!focus) {
      try {
        map.flyTo([-33.4489, -70.6693], 11, { duration: 1.3 });
      } catch {
        map.setView([-33.4489, -70.6693], 11);
      }
    }
  }, [focus, activated]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-slate-900/0 via-slate-900/5 to-slate-900/20" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ boxShadow: "inset 0 0 60px rgba(15,23,42,0.35)" }} />
    </div>
  );
}
