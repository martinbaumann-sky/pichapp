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
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authNext, setAuthNext] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">PichApp</Link>
        <nav className="hidden md:flex items-center gap-2">
          {navLink("/explorar", "Explorar")}
          <button
            onClick={() => {
              if (!user) { setAuthNext("/organizar"); setAuthOpen(true); } else router.push("/organizar");
            }}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors",
              pathname === "/organizar" ? "bg-gray-100 text-black" : "text-gray-700"
            )}
          >
            Organizar
          </button>
        </nav>

        {/* Perfil / Auth */}
        <div className="relative">
          <button
            aria-label="perfil"
            onClick={() => {
              if (user) {
                setMenuOpen((v) => !v);
              } else {
                setAuthNext(undefined);
                setAuthOpen(true);
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <UserIcon className="w-5 h-5" />
          </button>
          {user && menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg py-1 z-50 origin-top-right transform transition-all duration-150">
              <div className="px-3 py-2 text-sm text-gray-500 border-b">
                {user.name}
              </div>
              <Link href="/dashboard" className="block px-3 py-2 text-sm hover:bg-gray-100">Dashboard</Link>
              <Link href="/perfil" className="block px-3 py-2 text-sm hover:bg-gray-100">Perfil</Link>
              <button onClick={async () => { await signOut(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Cerrar sesión</button>
            </div>
          )}
        </div>
        <AuthDialog open={authOpen} onOpenChange={(o)=>{ setAuthOpen(o); if(!o) setAuthNext(undefined); }} initialTab="login" next={authNext} />

        <div className="md:hidden">
          <Link href="/explorar" className="px-3 py-2 rounded-lg text-sm bg-black text-white">Explorar</Link>
        </div>
      </div>
    </header>
  );
}


