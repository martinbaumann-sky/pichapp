"use client";

import { useEffect } from "react";

export default function ChunkErrorHandler() {
  useEffect(() => {
    const alreadyReloadedKey = "chunk-error-auto-reloaded";

    function shouldHandle(msg: string) {
      return /ChunkLoadError|loading chunk|CSS chunk load failed|Failed to fetch dynamically imported module|Importing a module script failed|react-server-dom-webpack.*loadChunk/i.test(
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
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}


