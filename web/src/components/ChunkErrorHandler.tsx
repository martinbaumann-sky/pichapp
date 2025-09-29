"use client";

import { useEffect, useState } from "react";

const RELOAD_KEY = "chunk-error-auto-reloaded";

export default function ChunkErrorHandler() {
  const [fatalChunkError, setFatalChunkError] = useState(false);
  const [lastReason, setLastReason] = useState<string | null>(null);

  useEffect(() => {
    function shouldHandle(msg: string) {
      return /ChunkLoadError|loading chunk|CSS chunk load failed|Failed to fetch dynamically imported module|Importing a module script failed|react-server-dom-webpack.*loadChunk/i.test(
        msg,
      );
    }

    function triggerReload(reason: string) {
      let hasReloadedBefore = false;
      try {
        // Avoid reload loops: only once per page session
        hasReloadedBefore = !!sessionStorage.getItem(RELOAD_KEY);
        if (!hasReloadedBefore) {
          sessionStorage.setItem(RELOAD_KEY, `1:${Date.now()}`);
        }
      } catch {
        // If sessionStorage is unavailable, fallback to manual recovery
        hasReloadedBefore = true;
      }
      if (hasReloadedBefore) {
        setLastReason(reason);
        setFatalChunkError(true);
        return;
      }
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
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  if (!fatalChunkError) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[999] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-xl flex-col gap-3 rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-lg">
        <div>
          <p className="text-sm font-semibold text-gray-900">No pudimos cargar una parte de la aplicación.</p>
          <p className="mt-1 text-xs text-gray-600">
            {lastReason ? `Código: ${lastReason}` : "El archivo de la última actualización no está disponible."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_KEY);
            } catch {}
            window.location.reload();
          }}
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Reintentar recarga
        </button>
      </div>
    </div>
  );
}


