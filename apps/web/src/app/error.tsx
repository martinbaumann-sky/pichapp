"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-bold mb-2">Algo salió mal</h1>
      <p className="text-gray-600 mb-6">Intenta nuevamente o vuelve al inicio.</p>
      <Link href="/explorar" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
        Explorar partidos
      </Link>
    </div>
  );
}


