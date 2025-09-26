import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="container container-px py-8 text-sm text-[color:var(--fg-muted)] flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} PichangApp</p>
        <nav className="flex items-center gap-4">
          <Link href="/ayuda" className="hover:text-[color:var(--fg)]">Ayuda</Link>
          <Link href="/terminos" className="hover:text-[color:var(--fg)]">Términos</Link>
          <Link href="/privacidad" className="hover:text-[color:var(--fg)]">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}
