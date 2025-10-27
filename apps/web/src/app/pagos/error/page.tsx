"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PagoErrorContent() {
  const params = useSearchParams();
  const matchId = params.get("matchId");
  const href = matchId ? `/match/${matchId}` : "/explorar";
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-bold mb-2">Hubo un problema con tu pago</h1>
      <p className="text-gray-600 mb-6">Puedes reintentar el proceso.</p>
      <Link href={href} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">Reintentar</Link>
    </div>
  );
}

export default function PagoError() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex flex-col items-center justify-center">Cargando...</div>}>
      <PagoErrorContent />
    </Suspense>
  );
}


