import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} PichApp</p>
        <nav className="flex items-center gap-4">
          <Link href="/ayuda" className="hover:text-black">Ayuda</Link>
          <Link href="/legal/terminos" className="hover:text-black">Términos</Link>
          <Link href="/legal/privacidad" className="hover:text-black">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}


