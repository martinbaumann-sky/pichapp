import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="container container-px py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} PichangApp</p>
        <nav className="flex items-center gap-4">
          <Link href="/ayuda" className="hover:text-black">Ayuda</Link>
          <Link href="/terminos" className="hover:text-black">Términos</Link>
          <Link href="/privacidad" className="hover:text-black">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}
