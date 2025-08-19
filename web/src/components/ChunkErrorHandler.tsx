"use client";

import { useEffect } from "react";

export default function ChunkErrorHandler() {
  useEffect(() => {
    function onError(ev: any) {
      // Detect webpack chunk load errors and reload to recover
      const msg = ev?.message || (ev?.error && ev.error.message) || "";
      if (typeof msg === "string" && /ChunkLoadError|loading chunk/i.test(msg)) {
        console.warn("ChunkLoadError detected, reloading page to recover.");
        // small timeout to allow devtools to show error
        setTimeout(() => window.location.reload(), 200);
      }
    }

    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  return null;
}


