"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { MP_POPUP_MESSAGE_SOURCE } from "@/lib/mp/constants";

export default function MpPopupCompletePage() {
  const params = useSearchParams();
  const status = params.get("status") ?? "unknown";
  const reason = params.get("reason");
  const venueId = params.get("venueId");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = {
      source: MP_POPUP_MESSAGE_SOURCE,
      status,
      reason: reason ?? null,
      venueId: venueId ?? null,
    } as const;

    try {
      window.opener?.postMessage(payload, window.location.origin);
    } catch (err) {
      console.error("[panel/cancha/mp/complete]", err);
    }

    const timer = window.setTimeout(() => {
      try {
        window.close();
      } catch (err) {
        console.error("[panel/cancha/mp/complete] close", err);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [status, reason, venueId]);

  const view = useMemo(() => {
    if (status === "connected") {
      return {
        title: "Cuenta vinculada",
        message: "Tu cuenta de Mercado Pago quedó conectada. Esta ventana se cerrará automáticamente.",
      };
    }
    if (status === "error") {
      return {
        title: "No pudimos conectar Mercado Pago",
        message: reason
          ? `Mercado Pago devolvió el error: ${reason}. Puedes cerrar esta ventana y volver a intentarlo.`
          : "Ocurrió un error al enlazar Mercado Pago. Puedes cerrar esta ventana y volver a intentarlo.",
      };
    }
    return {
      title: "Volviendo a PichangApp",
      message: "Puedes cerrar esta ventana si no se cierra automáticamente.",
    };
  }, [status, reason]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-slate-900">{view.title}</h1>
        <p className="mt-3 text-sm text-slate-600">{view.message}</p>
        <p className="mt-8 text-xs text-slate-400">Si la ventana no se cierra, puedes hacerlo manualmente.</p>
      </div>
    </div>
  );
}
