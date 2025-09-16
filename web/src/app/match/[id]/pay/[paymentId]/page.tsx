"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ProviderAvailability {
  MP?: boolean;
  MP_QR?: boolean;
  WEBPAY?: boolean;
  KHIPU?: boolean;
  FLOW?: boolean;
  FINTOC?: boolean;
}

type QrInfo = { provider: string; qrUrl?: string | null; url?: string | null } | null;

export default function PaymentPage() {
  const routeParams = useParams() as any;
  const id = routeParams?.id as string;
  const paymentId = routeParams?.paymentId as string;
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderAvailability>({});
  const [qrInfo, setQrInfo] = useState<QrInfo>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, mRes, cfgRes] = await Promise.all([
          fetch(`/api/payments/${paymentId}`),
          fetch(`/api/matches/${id}`),
          fetch(`/api/config`, { cache: "no-store" }),
        ]);
        if (pRes.ok) setPayment(await pRes.json());
        if (mRes.ok) setMatch(await mRes.json());
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          setProviders(cfg?.features?.payments?.providers ?? {});
        }
      } catch (err) {
        setError("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, paymentId]);

  const startCheckout = async (provider: string) => {
    setError(null);
    setQrInfo(null);
    setProcessingKey(provider);
    try {
      const res = await fetch(`/api/matches/${id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, provider }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo iniciar checkout");
      }
      if (data.type === "qr") {
        setQrInfo({ provider, qrUrl: data.qrUrl ?? null, url: data.url ?? null });
        setProcessingKey(null);
        return;
      }
      const url = data.url;
      if (!url) throw new Error("No se obtuvo URL de pago");
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar checkout");
      setProcessingKey(null);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Cargando...</div>;

  const availableCards = [
    {
      key: "MP",
      title: "Mercado Pago",
      description: "Tarjeta, RedCompra o transferencia",
    },
    {
      key: "MP_QR",
      title: "Mercado Pago QR",
      description: "Escanea desde la app de Mercado Pago",
    },
    {
      key: "WEBPAY",
      title: "Webpay / Redcompra",
      description: "Pagos con tarjeta via Webpay",
    },
    {
      key: "KHIPU",
      title: "Khipu",
      description: "Transferencia bancaria inmediata",
    },
    {
      key: "FLOW",
      title: "Flow",
      description: "Transferencia One-Click",
    },
    {
      key: "FINTOC",
      title: "Fintoc",
      description: "Conecta tu banco y confirma en segundos",
    },
  ].filter((card) => providers[card.key as keyof ProviderAvailability]);

  return (
    <div className="min-h-[60vh] bg-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Pagar cupo</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <p className="text-sm text-gray-600 mb-1">Partido: <strong>{match?.title ?? "-"}</strong></p>
        <p className="text-lg font-semibold mb-6">Precio: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(payment?.payment?.amountCLP ?? payment?.payment?.amount ?? 0)}</p>

        {availableCards.length === 0 && (
          <div className="text-sm text-amber-600 border border-amber-200 rounded-lg p-4 mb-6">
            Ningun proveedor de pago esta configurado. Contacta a soporte para activar tus credenciales.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {availableCards.map((card) => (
            <div key={card.key} className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              <button
                disabled={processingKey === card.key}
                onClick={() => startCheckout(card.key)}
                className="w-full px-4 py-3 bg-black text-white rounded disabled:opacity-70"
              >
                {processingKey === card.key ? "Procesando..." : "Ir a pagar"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-500">Al completar el pago regresarás automaticamente a PichangApp.</div>
      </div>

      {qrInfo && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full text-center space-y-4">
            <h2 className="text-xl font-semibold">Escanea el QR ({qrInfo.provider})</h2>
            {qrInfo.qrUrl ? (
              <img src={qrInfo.qrUrl} alt="QR de pago" className="mx-auto w-64 h-64" />
            ) : (
              <p className="text-sm text-gray-600">Abre el link desde tu dispositivo movil.</p>
            )}
            {qrInfo.url && (
              <div className="text-xs text-gray-500 break-words">
                {qrInfo.url}
              </div>
            )}
            <button
              onClick={() => setQrInfo(null)}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
