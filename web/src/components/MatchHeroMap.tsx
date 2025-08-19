"use client";

import { useEffect, useRef } from "react";

type Props = { lat?: number | null; lng?: number | null; title?: string };

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

export default function MatchHeroMap({ lat, lng, title }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    ensureLeafletLoaded()
      .then(() => {
        if (!mounted) return;
        const L = (globalThis as any).L;
        if (!ref.current) return;

        // init map
        if (!mapRef.current) {
          mapRef.current = L.map(ref.current, { zoomControl: true });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(mapRef.current);
        }

        // Ensure default marker icons point to CDN images (when Leaflet cargado vía CDN)
        try {
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        } catch (e) {}

        // clear previous markers
        if (mapRef.current._markersLayer) {
          mapRef.current.removeLayer(mapRef.current._markersLayer);
        }

        if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
          const markersLayer = L.layerGroup();

          // Crear un icono inline (SVG) para evitar imágenes externas rotas
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

          const marker = pinIcon ? L.marker([lat, lng], { icon: pinIcon }) : L.circleMarker([lat, lng], { radius: 8, color: "#16a34a", weight: 2, fillColor: "#16a34a", fillOpacity: 0.9 });
          marker.bindPopup(`<strong>${escapeHtml(title ?? "Partido")}</strong>`).openPopup();
          marker.addTo(markersLayer);

          // Añadir marcador secundario tipo círculo para asegurar visibilidad
          try {
            const circle = L.circle([lat, lng], { radius: 8, color: "#16a34a", weight: 2, fillColor: "#16a34a", fillOpacity: 0.9 });
            circle.addTo(markersLayer);
          } catch (e) {}

          markersLayer.addTo(mapRef.current);
          mapRef.current._markersLayer = markersLayer;
          mapRef.current.setView([lat, lng], 15, { animate: true });

          // Ensure tiles are rendered correctly after layout — call invalidate multiple times
          const safeInvalidate = () => {
            try {
              mapRef.current.invalidateSize(true);
            } catch (e) {}
          };
          safeInvalidate();
          if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(safeInvalidate);
          setTimeout(safeInvalidate, 100);
          setTimeout(safeInvalidate, 300);
          setTimeout(safeInvalidate, 700);
        } else {
          // No coords: set default view and invalidate so tiles load
          try {
            mapRef.current.setView([-33.4489, -70.6693], 12);
            mapRef.current.invalidateSize(true);
            requestAnimationFrame(() => mapRef.current.invalidateSize(true));
          } catch (e) {}
        }
      })
      .catch(() => {});

    return () => { mounted = false; if (mapRef.current) { try { mapRef.current.remove(); } catch (e) {} mapRef.current = null; } };
  }, [lat, lng, title]);

  return <div ref={ref} style={{ width: "100%", height: 420 }} />;
}

function escapeHtml(s: any) {
  if (!s && s !== 0) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}


