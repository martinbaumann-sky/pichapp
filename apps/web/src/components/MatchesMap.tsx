"use client";

import { useEffect, useRef } from "react";

type Props = { items: any[] };

function ensureLeafletLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((globalThis as any).L) return resolve();

    // insert CSS if not present
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

export default function MatchesMap({ items }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    ensureLeafletLoaded()
      .then(() => {
        if (!mounted) return;
        const L = (globalThis as any).L;
        if (!ref.current) return;

        // init map if not already
        if (!mapRef.current) {
          mapRef.current = L.map(ref.current, { scrollWheelZoom: false });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(mapRef.current);
        }

        // clear existing markers layer
        if (mapRef.current._markersLayer) {
          mapRef.current.removeLayer(mapRef.current._markersLayer);
        }

        const markersLayer = L.layerGroup();
        mapRef.current._markersLayer = markersLayer;

        const valid = items.filter((it) => it.lat != null && it.lng != null && !isNaN(Number(it.lat)) && !isNaN(Number(it.lng)));
        if (valid.length === 0) {
          mapRef.current.setView([-33.4489, -70.6693], 12);
        } else {
          const bounds = [] as any[];
          // create a consistent inline SVG pin icon so we don't depend on external images
          const pinSvg = `
            <svg width="24" height="32" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0C8 0 3.5 4.5 3.5 10.5 3.5 19 14 36 14 36s10.5-17 10.5-25.5C24.5 4.5 20 0 14 0z" fill="#16a34a"/>
              <circle cx="14" cy="10" r="4" fill="#ffffff"/>
            </svg>`;

          let pinIcon;
          try {
            pinIcon = L.divIcon({ html: pinSvg, className: 'match-pin', iconSize: [28,36], iconAnchor: [14,36] });
          } catch (e) {
            pinIcon = undefined;
          }

          valid.forEach((it) => {
            const opts: any = {};
            if (pinIcon) opts.icon = pinIcon;
            const marker = opts.icon ? L.marker([it.lat, it.lng], opts) : L.marker([it.lat, it.lng]);
            marker.bindPopup(`<div style="max-width:200px"><strong>${escapeHtml(it.title)}</strong><div style="font-size:12px;color:#666">${escapeHtml(it.venueName ?? it.comuna ?? "")}</div><div style=\"margin-top:6px\"><a href='/match/${it.id}' class=\"text-blue-600\">Ver</a> • <a href=\"https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.lat + ',' + it.lng)}\" target=\"_blank\" rel=\"noreferrer\" class=\"text-blue-600\">Abrir en Maps</a></div></div>`);
            marker.addTo(markersLayer);
            bounds.push([it.lat, it.lng]);
          });
          markersLayer.addTo(mapRef.current);
          if (bounds.length === 1) mapRef.current.setView(bounds[0], 15);
          else mapRef.current.fitBounds(bounds, { maxZoom: 15, padding: [40, 40] });
        }
      })
      .catch(() => {
        // ignore load errors
      });

    return () => {
      mounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (e) {}
      }
    };
  }, [items]);

  return <div ref={ref} style={{ width: "100%", height: 300 }} />;
}

function escapeHtml(s: any) {
  if (!s && s !== 0) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}


