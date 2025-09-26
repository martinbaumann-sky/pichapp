"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function PaymentDisabledPage() {
  const routeParams = useParams() as any;
  const id = routeParams?.id as string;

  return (
    <div className="min-h-[60vh] bg-[color:var(--bg)] flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white border border-[color:var(--border)] rounded-xl shadow-sm p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[color:var(--fg)]">Pagos deshabilitados</h1>
        <p className="text-[color:var(--fg-muted)]">
          No necesitas pagar para confirmar tu cupo. Todas las reservas son gratuitas en este lanzamiento.
        </p>
        <Link
          href={id ? `/match/${id}` : "/explorar"}
          className="inline-flex items-center justify-center px-6 py-3 bg-[color:var(--brand-1)] text-white rounded-lg font-semibold hover:bg-brand-600"
        >
          Volver al partido
        </Link>
      </div>
    </div>
  );
}
