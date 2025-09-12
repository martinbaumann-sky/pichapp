"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { cn } from "../utils/cn";
import AuthDialog from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authNext, setAuthNext] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup">("login");

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        pathname === href
          ? "bg-gray-100 text-black shadow-sm"
          : "text-gray-700 hover:bg-gray-100 hover:-translate-y-0.5"
      )}
    >
      {label}
    </Link>
  );

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
    if (mobileOpen) setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="24" height="24" rx="6" fill="var(--brand-2)" />
              <path d="M6 12h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2" fill="white" />
            </svg>
            <span className="font-bold text-lg tracking-tight">PichangApp</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          {navLink("/explorar", "Explorar")}
          <button onClick={() => { if (!user) { setAuthOpen(true); setAuthNext('/organizar'); setAuthInitialTab('signup'); } else router.push('/organizar'); }} className="btn-primary">Crear partido</button>
        </nav>

        {/* Perfil / Auth */}
        <div className="relative flex items-center gap-2">
          <button
            aria-label="perfil"
            onClick={() => {
              if (loading) return;
              if (user) {
                setMenuOpen((v) => !v);
              } else {
                setAuthNext(undefined);
                setAuthInitialTab('login');
                setAuthOpen(true);
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <UserIcon className="w-5 h-5" />
          </button>
          {user && !loading && menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg py-1 z-50 origin-top-right transform transition-all duration-150">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                {user.name}
              </div>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-gray-100">Dashboard</Link>
              <Link href="/perfil" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-gray-100">Perfil</Link>
              <button onClick={async () => { await signOut(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Cerrar sesión</button>
            </div>
          )}
        </div>

        <AuthDialog open={authOpen} onOpenChange={(o)=>{ setAuthOpen(o); if(!o) setAuthNext(undefined); }} initialTab={authInitialTab} next={authNext} />

        {/* Mobile */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileOpen((v)=>!v)} className="p-2 rounded-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 6h18M3 12h18M3 18h18" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="flex flex-col gap-2">
            <Link href="/explorar" className="px-4 py-2 rounded-lg text-sm bg-white/90">Explorar</Link>
            <button onClick={() => { if (!user) { setAuthOpen(true); setAuthNext('/organizar'); setAuthInitialTab('signup'); } else router.push('/organizar'); }} className="btn-primary">Crear partido</button>
          </div>
        </div>
      )}
    </header>
  );
}
