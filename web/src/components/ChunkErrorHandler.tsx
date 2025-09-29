"use client";

import { useEffect, useState } from "react";

export default function ChunkErrorHandler() {
  const [stuck, setStuck] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const alreadyReloadedKey = "chunk-error-auto-reloaded";

    function shouldHandle(msg: string) {
      return /ChunkLoadError|loading chunk|CSS chunk load failed|Failed to fetch dynamically imported module|Importing a modulescript failed|react-server-dom-webpack.*loadChunk/i.test(
        msg,
      );
    }

    function triggerReload(reason: string) {
      try {
        // Avoid reload loops: only once per page session
        if (sessionStorage.getItem(alreadyReloadedKey)) return;
        sessionStorage.setItem(alreadyReloadedKey, `1:${Date.now()}`);
      } catch {}
      console.warn(`Chunk loader failure detected (${reason}). Reloading...`);
      setTimeout(() => window.location.reload(), 200);
    }

    function onError(ev: any) {
      const msg = ev?.message || ev?.filename || ev?.lineno || (ev?.error && ev.error.message) || "";
      if (typeof msg === "string" && shouldHandle(msg)) {
        triggerReload("error");
      }
    }

    function onUnhandledRejection(ev: any) {
      const msg = ev?.reason?.message || ev?.reason || "";
      if (typeof msg === "string" && shouldHandle(msg)) {
        triggerReload("unhandledrejection");
      }
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    try {
      const marker = sessionStorage.getItem(alreadyReloadedKey);
      if (marker) {
        const [, timestamp] = marker.split(":");
        const last = Number(timestamp);
        const recentlyReloaded = Number.isFinite(last) ? Date.now() - last < 60_000 : false;
        sessionStorage.removeItem(alreadyReloadedKey);
        if (recentlyReloaded) {
          setStuck(true);
          setMessage(
            "No pudimos recargar los módulos de la app automáticamente. Intenta nuevamente o limpia la cache del navegador.",
          );
        }
      }
    } catch {}

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  const handleHardReload = () => {
    try {
      caches?.keys?.()
        .then((keys) => keys.forEach((key) => caches.delete(key)))
        .catch(() => undefined);
    } catch {}
    setStuck(false);
    const url = new URL(window.location.href);
    url.searchParams.set("_", Date.now().toString());
    window.location.href = url.toString();
  };

  if (!stuck) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur">
      <div className="max-w-sm rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          !
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Necesitamos recargar la app</h2>
        <p className="mt-2 text-sm text-gray-600">
          {message || "Actualizamos la plataforma y tu navegador mantiene una versión anterior. Recarga para continuar."}
        </p>
        <button
          type="button"
          onClick={handleHardReload}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Recargar ahora
        </button>
      </div>
    </div>
  );
}
