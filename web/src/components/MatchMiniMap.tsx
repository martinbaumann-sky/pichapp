"use client";

import { useEffect, useRef } from "react";

type Props = { lat?: number | null; lng?: number | null; title?: string; id?: string };

function ensureLeafletLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((globalThis as any).L) return resolve();

    if (!document.querySelector("link[data-leaflet]")) {
      const link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("data-leaflet", "1");
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if ((globalThis as any).L) return resolve();

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
}

export default function MatchMiniMap({ lat, lng, title, id }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    if (lat == null || lng == null) return;
    ensureLeafletLoaded().then(() => {
      if (!mounted) return;
      const L = (globalThis as any).L;
      if (!containerRef.current) return;

      // remove previous map if exists
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
      }

      mapRef.current = L.map(containerRef.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);

      // Crear pin SVG inline (mismo estilo que en otros mapas)
      const pinSvg = `
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C8 0 3.5 4.5 3.5 10.5 3.5 19 14 36 14 36s10.5-17 10.5-25.5C24.5 4.5 20 0 14 0z" fill="#16a34a"/>
          <circle cx="14" cy="10" r="4" fill="#ffffff"/>
        </svg>`;
      let pinIcon;
      try {
        pinIcon = L.divIcon({ html: pinSvg, className: 'match-pin', iconSize: [28,36], iconAnchor: [14,36] });
      } catch (e) {
        pinIcon = undefined;
      }

      const marker = pinIcon ? L.marker([lat, lng], { icon: pinIcon }).addTo(mapRef.current) : L.marker([lat, lng]).addTo(mapRef.current);
      marker.bindPopup(`<div style=\"max-width:200px\"><strong>${escapeHtml(title ?? "Partido")}</strong><div style=\"font-size:12px;color:#666\">${escapeHtml(id ?? "")}</div></div>`);
      mapRef.current.setView([lat, lng], 15);
    }).catch(() => {});

    return () => { mounted = false; if (mapRef.current) { try { mapRef.current.remove(); } catch (e) {} mapRef.current = null; } };
  }, [lat, lng, title, id]);

  if (lat == null || lng == null) {
    return (
      <div className="h-48 w-full bg-gradient-to-br from-[color:var(--bg-subtle)] to-white flex items-center justify-center">
        <img src="/globe.svg" alt="Ubicación" className="h-12 w-12 opacity-50" />
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: "100%", height: 192 }} />;
}

function escapeHtml(s: any) {
  if (!s && s !== 0) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}


