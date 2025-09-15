"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User as UserIcon, LayoutDashboard, Users, UserCircle, LogOut } from "lucide-react";
import { cn } from "../utils/cn";
import AuthDialog from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";

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

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "relative px-3 py-2 rounded-full text-sm font-medium transition-all duration-150",
          active ? "text-black" : "text-gray-700 hover:bg-gray-100 hover:-translate-y-0.5"
        )}
      >
        {active && (
          <motion.span
            layoutId="navActiveBg"
            className="absolute inset-0 rounded-full bg-gray-100 shadow-sm"
            transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.2 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    );
  };

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
    if (mobileOpen) setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 border-b">
      <div className="container h-16 container-px flex items-center justify-between">
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
          <button
            onClick={() => {
              if (!user) {
                setAuthOpen(true);
                setAuthNext("/organizar");
                setAuthInitialTab("signup");
              } else router.push("/organizar");
            }}
            className="btn-primary"
          >
            Crear partido
          </button>
        </nav>

        {/* Perfil / Auth */}
        <div className="relative flex items-center gap-2">
          {!user ? (
            <button
              aria-label="perfil"
              onClick={() => {
                if (loading) return;
                setAuthNext(undefined);
                setAuthInitialTab("login");
                setAuthOpen(true);
              }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          ) : (
            <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenu.Trigger asChild>
                <button onClick={() => setMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10 transition">
                  <UserIcon className="w-5 h-5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={10}
                  align="end"
                  className="dropdown-content z-50 min-w-56 rounded-2xl border bg-white/95 backdrop-blur-xl shadow-lg p-2 focus:outline-none transform origin-[var(--radix-dropdown-menu-content-transform-origin)]"
                >
                  <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-white border">
                    <div className="text-xs text-gray-500">Sesión</div>
                    <div className="font-medium text-black truncate">{user.name}</div>
                  </div>
                  <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />

                  <DropdownMenu.Item asChild>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 text-gray-600" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/amigos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span>Amigos</span>
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                      <UserCircle className="w-4 h-4 text-gray-600" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={async () => {
                        await signOut();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-50 focus:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>

        <AuthDialog
          open={authOpen}
          onOpenChange={(o) => {
            setAuthOpen(o);
            if (!o) setAuthNext(undefined);
          }}
          initialTab={authInitialTab}
          next={authNext}
        />

        {/* Mobile */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded-md">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="#0f172a"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.4, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="container container-px pb-4">
              <div className="flex flex-col gap-2">
                <Link href="/explorar" className="px-4 py-2 rounded-xl text-sm bg-white/90">
                  Explorar
                </Link>
                <Link href="/amigos" className="px-4 py-2 rounded-xl text-sm bg-white/90">
                  Amigos
                </Link>
                <button
                  onClick={() => {
                    if (!user) {
                      setAuthOpen(true);
                      setAuthNext("/organizar");
                      setAuthInitialTab("signup");
                    } else router.push("/organizar");
                  }}
                  className="btn-primary"
                >
                  Crear partido
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
