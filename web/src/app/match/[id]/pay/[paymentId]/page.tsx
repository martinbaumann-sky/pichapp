"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PaymentPage() {
  const routeParams = useParams() as any;
  const id = routeParams?.id as string;
  const paymentId = routeParams?.paymentId as string;
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [mpEnabled, setMpEnabled] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, mRes, cfgRes] = await Promise.all([
          fetch(`/api/payments/${paymentId}`),
          fetch(`/api/matches/${id}`),
          fetch(`/api/config`, { cache: 'no-store' }),
        ]);
        if (pRes.ok) setPayment(await pRes.json());
        if (mRes.ok) setMatch(await mRes.json());
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          setMpEnabled(Boolean(cfg?.features?.payments?.mpEnabled));
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
    setProcessing(true);
    try {
      const res = await fetch(`/api/matches/${id}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId, provider }), credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(body || "No se pudo iniciar checkout");
      }
      const data = await res.json();
      const url = data.init_point || data.checkoutUrl;
      if (!url) throw new Error("No se obtuvo URL de pago");
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar checkout");
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-[60vh] bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Pagar cupo</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <p className="text-sm text-gray-600 mb-4">Partido: <strong>{match?.title ?? "-"}</strong></p>
        <p className="text-lg font-semibold mb-6">Precio: {new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format((payment?.payment?.amountCLP ?? payment?.payment?.amount ?? 0))}</p>

        <div className="grid md:grid-cols-2 gap-4">
          {mpEnabled && (
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">MercadoPago</h3>
              <p className="text-sm text-gray-600 mb-4">Paga con tarjeta, RedCompra o transferencia.</p>
              <button disabled={processing} onClick={() => startCheckout("MP")} className="w-full px-4 py-3 bg-black text-white rounded">Pagar con MercadoPago</button>
            </div>
          )}
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Transbank</h3>
            <p className="text-sm text-gray-600 mb-4">Paga con Webpay (sandbox).</p>
            <button disabled={processing} onClick={() => startCheckout("TB")} className="w-full px-4 py-3 bg-black text-white rounded">Pagar con Transbank</button>
          </div>
        </div>
        {!mpEnabled && <div className="mt-4 text-sm text-amber-600">Mercado Pago no está configurado, usando sólo Transbank (sandbox).</div>}

        <div className="mt-6 text-sm text-gray-500">Al completar el pago serás redirigido de vuelta.</div>
      </div>
    </div>
  );
}

