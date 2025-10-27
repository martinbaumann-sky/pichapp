import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="container container-px py-8 text-sm text-gray-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p>© {new Date().getFullYear()} PichangApp</p>
          <p className="mt-1 text-xs text-gray-500">Encuentra pichangas verificadas cerca de ti.</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="flex-1 md:flex-none rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-gray-900">¿Administras una cancha?</p>
            <p className="mt-1 text-xs text-gray-500">Publica partidos oficiales y cobra en línea desde el panel de canchas.</p>
            <Link href="/cancha" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              <span>Conocer PichangApp para canchas</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-xs md:text-sm">
            <Link href="/ayuda" className="hover:text-black">Ayuda</Link>
            <Link href="/terminos" className="hover:text-black">Términos</Link>
            <Link href="/privacidad" className="hover:text-black">Privacidad</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
