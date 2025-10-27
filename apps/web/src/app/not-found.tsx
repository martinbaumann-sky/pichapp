import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-3xl font-bold mb-2">Página no encontrada</h1>
      <p className="text-gray-600 mb-6">No pudimos encontrar lo que buscabas.</p>
      <Link href="/explorar" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
        Explorar partidos
      </Link>
    </div>
  );
}


